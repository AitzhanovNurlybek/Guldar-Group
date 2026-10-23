"use client";

/* eslint-disable react-hooks/immutability -- R3F owns mutable Three.js objects; frame updates must not use React state. */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import * as THREE from "three";
import { subscribeFrame } from "./scroll";
import { sceneMotion, subscribeScene } from "./motion-state";
import { animationConfig } from "./animation-config";
import { getQuality, performanceBudget, quality, setQuality, useQuality } from "./quality";

declare global { interface Window { __guldarDiagnostics?: { quality: string; drawCalls: number; triangles: number; renderedFrames: number; renderFps: number; postprocessing: boolean; paused: boolean } } }
const parts = [
  { name: "finishFloor", start: 0.015, end: 0.15, x: 0, y: -1.1, z: 2 },
  { name: "finishLeft", start: 0.07, end: 0.27, x: -2.8, y: 0.6, z: 0 },
  { name: "finishBack", start: 0.1, end: 0.3, x: 0, y: 2.8, z: -1.8 },
  { name: "tileJoints", start: 0.16, end: 0.3, x: 0, y: 0.2, z: 2.3 },
  { name: "networks", start: 0.31, end: 0.43, x: 0, y: 2.5, z: 0 },
  { name: "lights", start: 0.35, end: 0.48, x: 0, y: 3, z: 0 },
  { name: "counter", start: 0.49, end: 0.65, x: 3, y: 0.6, z: 0 },
  { name: "shelves", start: 0.56, end: 0.72, x: -2, y: 2.5, z: 0 },
  { name: "desk", start: 0.73, end: 0.89, x: 0, y: -1.5, z: 2.4 },
  { name: "sofa", start: 0.79, end: 0.96, x: 2.5, y: 0, z: 2.5 },
  { name: "decor", start: 0.83, end: 1, x: 0, y: 2.7, z: -1.5 },
];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

function Room({ onReady }: { onReady: () => void }) {
  const gltf = useLoader(GLTFLoader, "/scene/room.meshopt.glb", (loader) => loader.setMeshoptDecoder(MeshoptDecoder));
  const root = useRef<THREE.Group>(null);
  const rendered = useRef(false);
  const size = useThree((state) => state.size);
  // Keep the enlarged room inside narrow or tall scene containers.
  const fit = Math.max(1, (size.height / Math.max(1, size.width)) * 1.18);
  const fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(Math.PI / 12) * fit));
  useEffect(() => { sceneMotion.revision++; }, [fov]);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const actors = useMemo(() => parts.map((part) => ({ ...part, object: model.getObjectByName(part.name) })), [model]);
  const temporary = useMemo(() => ["scaffold", "scaffoldRungs", "tools"].map((name) => model.getObjectByName(name)), [model]);
  const leftWallMaterials = useMemo(() => {
    const materials: THREE.MeshBasicMaterial[] = [];
    for (const name of ["leftWall", "finishLeft"]) model.getObjectByName(name)?.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const material = object.material.clone() as THREE.MeshBasicMaterial;
        material.transparent = true; object.material = material; materials.push(material);
      }
    });
    return materials;
  }, [model]);
  useEffect(() => { sceneMotion.revision++; return () => leftWallMaterials.forEach((material) => material.dispose()); }, [leftWallMaterials]);
  useFrame(({ camera }) => {
    if (!root.current) return;
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    const p = sceneMotion.current;
    root.current.rotation.y = -0.12 + p * animationConfig.roomRotation;
    root.current.rotation.x = -0.025 + Math.sin(p * Math.PI) * 0.045;
    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i], object = actor.object;
      if (!object) continue;
      const t = clamp((p - actor.start) / (actor.end - actor.start));
      const amount = ease(t), flight = 1 - amount;
      object.position.set(actor.x * flight, actor.y * flight + Math.sin(t * Math.PI) * 0.5, actor.z * flight);
      object.scale.setScalar(Math.max(0.01, 0.08 + amount * 0.92));
      object.rotation.y = flight * 0.18;
      object.visible = t > 0.001;
    }
    for (let i = 0; i < temporary.length; i++) {
      const object = temporary[i]; if (!object) continue;
      const t = clamp((p - (i === 2 ? 0.65 : 0.55)) / 0.24);
      object.position.y = t * t * 3; object.scale.setScalar(1 - t * 0.98); object.visible = t < 0.99;
    }
    const opacity = 1 - clamp((p - 0.3) / 0.2) * 0.94;
    for (let i = 0; i < leftWallMaterials.length; i++) { leftWallMaterials[i].opacity = opacity; leftWallMaterials[i].depthWrite = opacity > 0.9; }
    camera.position.x = 8 + sceneMotion.pointerX * 0.38;
    camera.position.y = 6.5 + p * 0.7 + sceneMotion.pointerY * 0.28;
    camera.lookAt(0, 0.25, 0);
    if (!rendered.current) { rendered.current = true; onReady(); }
  });
  return <group ref={root} position={[0, -1.25, 0]}><primitive object={model} /></group>;
}

function Dust({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { data[i * 3] = Math.sin(i * 4.17) * 4; data[i * 3 + 1] = 0.2 + ((i * 0.47) % 3); data[i * 3 + 2] = Math.cos(i * 2.31) * 3; }
    return data;
  }, [count]);
  useFrame(() => { if (points.current) points.current.rotation.y = sceneMotion.current * 0.12; });
  return <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial size={0.025} color="#d6b28a" opacity={0.3} transparent depthWrite={false} /></points>;
}

function Driver({ active, onDegrade }: { active: boolean; onDegrade: () => void }) {
  const setDpr = useThree((state) => state.setDpr);
  const advance = useThree((state) => state.advance);
  const gl = useThree((state) => state.gl);
  const level = useQuality();
  useEffect(() => { setDpr(Math.min(window.devicePixelRatio || 1, quality[level].maxDpr)); }, [level, setDpr]);
  useEffect(() => {
    if (!active) { if (window.__guldarDiagnostics) window.__guldarDiagnostics.paused = true; return; }
    let revision = -1, px = 0, py = 0, warmFrames = 5, count = 0, windowFrames = 0, windowStart = 0, lastRender = 0;
    let stopFrames: (() => void) | null = null;
    window.__guldarDiagnostics = { quality: getQuality(), drawCalls: 0, triangles: 0, renderedFrames: 0, renderFps: 0, postprocessing: false, paused: !active };
    const diagnostics = window.__guldarDiagnostics;
    const render = (time: number, delta: number) => {
      diagnostics.paused = !active || document.hidden;
      if (diagnostics.paused) return;
      const pointerChanged = Math.abs(px - sceneMotion.pointerX) + Math.abs(py - sceneMotion.pointerY) > 0.001;
      const dirty = revision !== sceneMotion.revision || pointerChanged || warmFrames > 0;
      if (!dirty) { windowStart = time; windowFrames = 0; stopFrames?.(); stopFrames = null; return; }
      const interval = 1 / performanceBudget.targetFps;
      if (time - lastRender < interval) return;
      lastRender = time - (time - lastRender) % interval;
      revision = sceneMotion.revision; px = sceneMotion.pointerX; py = sceneMotion.pointerY;
      count++; windowFrames++;
      advance(time);
      if (gl.info.render.triangles > 0) warmFrames = Math.max(0, warmFrames - 1);
      diagnostics.quality = getQuality(); diagnostics.drawCalls = gl.info.render.calls; diagnostics.triangles = gl.info.render.triangles; diagnostics.renderedFrames = count;
      if (!windowStart) windowStart = time;
      if (time - windowStart > 0.6) {
        diagnostics.renderFps = Math.round(windowFrames / (time - windowStart));
        if (diagnostics.renderFps < 40 && delta > 0.024) onDegrade();
        windowStart = time; windowFrames = 0;
      }
    };
    const wake = () => { if (!stopFrames) stopFrames = subscribeFrame(render, true); };
    const unsubscribe = subscribeScene(wake);
    wake();
    return () => { unsubscribe(); stopFrames?.(); };
  }, [active, advance, gl, onDegrade]);
  return <PerformanceMonitor bounds={() => [42, 70]} onDecline={onDegrade} onFallback={onDegrade} flipflops={2} />;
}

export default function RoomCanvas({ active, onReady, onFailure }: { active: boolean; onReady: () => void; onFailure: () => void }) {
  const level = useQuality();
  const [degrade] = useState(() => () => { if (getQuality() === "high") setQuality("medium"); });
  return <Canvas dpr={[1, 1.75]} frameloop="never" resize={{ scroll: false, offsetSize: true, debounce: 0 }} camera={{ position: [8, 6.5, 9], fov: 30, near: 0.1, far: 60 }}
    gl={{ antialias: window.innerWidth >= 1024, alpha: true, powerPreference: "high-performance" }}
    onCreated={({ gl }) => { gl.toneMapping = THREE.NoToneMapping; gl.domElement.addEventListener("webglcontextlost", onFailure, { once: true }); }}
    style={{ position: "absolute", inset: 0 }} fallback={null}>
    <Driver active={active} onDegrade={degrade} />
    <Suspense fallback={null}><Room onReady={onReady} /></Suspense>
    {quality[level].particles > 0 && <Dust count={quality[level].particles} />}
  </Canvas>;
}
