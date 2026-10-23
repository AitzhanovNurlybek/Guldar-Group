"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import * as THREE from "three";
import type { RoomAction } from "./RoomExplorer";

function Model({ onReady }: { onReady: () => void }) {
  const gltf = useLoader(GLTFLoader, "/scene/room-complete.glb", (loader) => loader.setMeshoptDecoder(MeshoptDecoder));
  const scene = useMemo(() => {
    const model = gltf.scene.clone(true);
    const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
    model.position.sub(center);
    return model;
  }, [gltf.scene]);
  useEffect(() => { onReady(); }, [onReady]);
  return <primitive object={scene} />;
}

function Controls({ action }: { action: RoomAction }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const describeView = useCallback(() => {
    const orbit = controls.current;
    if (!orbit) return;
    const angle = orbit.getAzimuthalAngle();
    gl.domElement.setAttribute("role", "img");
    gl.domElement.setAttribute("aria-label", `3D-макет помещения. Поворот ${Math.round(angle * 180 / Math.PI)} градусов.`);
    gl.domElement.setAttribute("data-view", [angle, orbit.getPolarAngle(), orbit.getDistance(), ...orbit.target.toArray()].map((value) => value.toFixed(4)).join("|"));
  }, [gl]);
  useEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    if (action.id === 0) {
      camera.position.set(9, 7, 10.5); orbit.target.set(0, -0.7, 0); orbit.update(); orbit.saveState();
    } else if (action.kind === "reset") orbit.reset();
    else orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + (action.kind === "left" ? -1 : 1) * Math.PI / 6);
    orbit.update();
    describeView();
    invalidate();
  }, [action, invalidate, camera, describeView]);
  return <OrbitControls ref={controls} makeDefault target={[0, -0.7, 0]} onChange={describeView} enableDamping={false} enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 7} maxPolarAngle={Math.PI / 2.3} rotateSpeed={0.65} />;
}

function ContextLoss({ onFailure }: { onFailure: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  return null;
}

export default function RoomOrbitCanvas({ action, onReady, onFailure }: { action: RoomAction; onReady: () => void; onFailure: () => void }) {
  return <Canvas className="room-orbit-canvas" frameloop="demand" dpr={[1, 1.25]} camera={{ position: [9, 7, 10.5], fov: 36, near: 0.1, far: 60 }}
    fallback={<p>Интерактивный просмотр недоступен в этом браузере.</p>}
    gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} resize={{ scroll: false, offsetSize: true }}
    onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1; }} style={{ position: "absolute", inset: 0, touchAction: "none" }}>
    <ContextLoss onFailure={onFailure} />
    <ambientLight intensity={1.5} />
    <directionalLight position={[5, 8, 6]} intensity={2.5} />
    <directionalLight position={[-5, 3, -3]} intensity={1} />
    <Suspense fallback={null}><Model onReady={onReady} /></Suspense>
    <Controls action={action} />
  </Canvas>;
}
