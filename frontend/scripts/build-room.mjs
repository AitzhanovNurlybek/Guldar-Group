import fs from 'node:fs/promises';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

// GLTFExporter needs only the asynchronous Blob-reading part of FileReader in Node.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((data) => { this.result = data; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((data) => { this.result = `data:${blob.type};base64,${Buffer.from(data).toString('base64')}`; this.onloadend?.(); }); }
};
const root = new T.Group(); root.name = 'GulDarRoom';
const material = new T.MeshBasicMaterial({ vertexColors: true });
const lightDirection = new T.Vector3(0.3, 0.85, 0.45).normalize();
const point = new T.Vector3(), normal = new T.Vector3(), color = new T.Color();
const parts = new Map();
const matrices = new T.Matrix4(), quaternion = new T.Quaternion();
const up = new T.Vector3(0, 1, 0);
const colors = { metal: '#405764', orange: '#ed873a', wood: '#b4926e', wall: '#dce2de', concrete: '#8e9a98' };

function part(name) { if (!parts.has(name)) parts.set(name, []); return parts.get(name); }
function bake(geometry, matrix, tint) {
  geometry.applyMatrix4(matrix);
  const position = geometry.attributes.position, normals = geometry.attributes.normal;
  const values = new Float32Array(position.count * 3);
  const base = new T.Color(tint);
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i); normal.fromBufferAttribute(normals, i);
    const direct = Math.max(0, normal.dot(lightDirection));
    const wallAO = 1 - 0.15 * Math.exp(-Math.max(0, point.z + 2.1) * 3);
    const floorAO = 1 - 0.12 * Math.exp(-Math.max(0, point.y - 0.25) * 4);
    const intensity = (0.62 + direct * 0.38) * wallAO * floorAO;
    color.copy(base).multiplyScalar(intensity);
    values[i * 3] = color.r; values[i * 3 + 1] = color.g; values[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new T.BufferAttribute(values, 3));
  return geometry;
}
function box(name, position, size, tint) {
  matrices.makeTranslation(...position);
  part(name).push(bake(new T.BoxGeometry(...size), matrices, tint));
}
function rod(name, from, to, radius = 0.028, tint = colors.metal) {
  const a = new T.Vector3(...from), b = new T.Vector3(...to), direction = b.clone().sub(a);
  quaternion.setFromUnitVectors(up, direction.clone().normalize());
  matrices.compose(a.add(b).multiplyScalar(0.5), quaternion, new T.Vector3(1, 1, 1));
  part(name).push(bake(new T.CylinderGeometry(radius, radius, direction.length(), 8), matrices, tint));
}
function instances(name, transforms, tint, kind = 'box') {
  const geometry = kind === 'cylinder' ? new T.CylinderGeometry(1, 1, 1, 8) : new T.BoxGeometry(1, 1, 1);
  const mesh = new T.InstancedMesh(geometry, new T.MeshBasicMaterial({ color: tint }), transforms.length);
  mesh.name = name;
  transforms.forEach(({ position, scale, rotation }, i) => {
    quaternion.setFromEuler(new T.Euler(...(rotation || [0, 0, 0])));
    matrices.compose(new T.Vector3(...position), quaternion, new T.Vector3(...scale));
    mesh.setMatrixAt(i, matrices);
  });
  const group = new T.Group(); group.name = name; group.add(mesh); root.add(group);
}

box('base', [0, 0, 0], [6.2, 0.25, 4.9], '#566b76');
box('base', [0, 0.15, 0], [6, 0.12, 4.7], colors.concrete);
box('base', [0, 1.72, -2.28], [6, 3.15, 0.16], colors.concrete);
box('leftWall', [-2.92, 1.72, 0], [0.16, 3.15, 4.7], '#7c8d8e');
for (let i = 0; i < 5; i++) box('base', [0, 0.5 + i * 0.57, -2.19], [5.9, 0.018, 0.01], '#7b8987');
box('finishFloor', [0, 0.23, 0], [5.98, 0.03, 4.6], '#bac3ba');
box('finishLeft', [-2.81, 1.74, 0], [0.055, 3.03, 4.52], colors.wall);
box('finishBack', [0, 1.74, -2.15], [5.8, 3.03, 0.055], '#e6e6dc');
instances('tileJoints', [-2, -1, 0, 1, 2].map((x) => ({ position: [x, 0.25, 0], scale: [0.012, 0.008, 4.5] })), '#8a9893');
rod('networks', [-2.7, 2.96, -2], [2.7, 2.96, -2], 0.04);
rod('networks', [-2.7, 2.96, -2], [-2.7, 2.96, 1.95], 0.04);
rod('networks', [-2.65, 0.65, -2.03], [-2.65, 2.96, -2.03], 0.025, colors.orange);
box('networks', [-2.62, 0.88, -2.04], [0.26, 0.37, 0.12], '#edf0e6');
for (const x of [-1.25, 1.25]) {
  rod('lights', [x, 3.05, -1.5], [x, 3.05, 1.45], 0.025);
  box('lights', [x, 2.92, 0], [0.12, 0.07, 2.8], '#fff0cd');
}
// Temporary works are merged separately so their exit remains one transform.
for (const x of [-1.9, -0.8]) for (const z of [-1.2, -0.4]) rod('scaffold', [x, 0.13, z], [x, 2.65, z], 0.035, colors.orange);
for (const y of [0.48, 1.4, 2.35]) {
  box('scaffold', [-1.35, y, -0.8], [1.25, 0.075, 0.94], colors.wood);
  rod('scaffold', [-1.9, y, -1.2], [-0.8, y + 0.85, -1.2]);
  rod('scaffold', [-0.8, y, -0.4], [-1.9, y + 0.85, -0.4]);
}
instances('scaffoldRungs', Array.from({ length: 7 }, (_, i) => ({ position: [-0.77, 0.3 + i * 0.32, -0.8], scale: [0.018, 0.8, 0.018], rotation: [Math.PI / 2, 0, 0] })), colors.metal, 'cylinder');
box('tools', [1.05, 0.5, 0.75], [0.9, 0.62, 0.62], colors.orange);
box('tools', [1.05, 0.53, 1.075], [0.5, 0.32, 0.025], colors.metal);
for (const x of [0.57, 1.53]) {
  for (const z of [0.37, 1.13]) rod('tools', [x, 0.1, z], [x, 0.97, z], 0.038);
  rod('tools', [x, 0.97, 0.37], [x, 0.97, 1.13], 0.038);
}
rod('tools', [0.57, 0.97, 0.75], [1.53, 0.97, 0.75], 0.038);
for (const side of [-1, 1]) {
  const x = side * 1.85, z = 1.3;
  rod('tools', [x, 0.08, z], [x, 2.1, z], 0.025);
  for (const a of [0, 2.1, 4.2]) rod('tools', [x, 0.65, z], [x + Math.cos(a) * 0.46, 0.08, z + Math.sin(a) * 0.46], 0.025);
  box('tools', [x, 2.14, z], [0.48, 0.32, 0.12], colors.orange);
  box('tools', [x, 2.14, z + 0.07], [0.39, 0.23, 0.025], '#fff0cd');
}
box('counter', [1.45, 0.82, -1.35], [2.05, 1.15, 0.75], '#344f5b');
box('counter', [1.45, 1.43, -1.35], [2.16, 0.09, 0.84], colors.wood);
box('counter', [1.45, 0.85, -0.96], [1.6, 0.025, 0.018], colors.orange);
box('shelves', [-1.45, 1, -1.77], [1.3, 1.54, 0.52], colors.metal);
for (const y of [0.5, 1, 1.5]) box('shelves', [-1.45, y, -1.44], [1.2, 0.045, 0.65], colors.wood);
box('desk', [-0.9, 0.86, 0.65], [1.8, 0.1, 0.9], colors.wood);
for (const x of [-1.62, -0.18]) box('desk', [x, 0.53, 0.65], [0.06, 0.58, 0.72], colors.metal);
box('desk', [-0.9, 1.06, 0.65], [0.43, 0.3, 0.035], '#1b303e');
box('desk', [-0.9, 0.94, 0.85], [0.43, 0.025, 0.28], '#72909b');
box('sofa', [1.65, 0.48, 1.3], [1.3, 0.38, 0.8], '#b8c6be');
box('sofa', [1.65, 0.89, 1.62], [1.3, 0.62, 0.2], '#a6b8ae');
for (const x of [1.15, 2.15]) box('sofa', [x, 0.3, 1.3], [0.07, 0.3, 0.65], colors.metal);
matrices.makeTranslation(2.48, 0.5, -1.72);
part('decor').push(bake(new T.CylinderGeometry(0.24, 0.16, 0.54, 12), matrices, colors.orange));
for (let i = 0; i < 5; i++) {
  matrices.makeTranslation(2.48 + Math.sin(i * 2.4) * 0.18, 1.1 + i * 0.08, -1.72 + Math.cos(i * 2.4) * 0.16);
  part('decor').push(bake(new T.SphereGeometry(0.25, 8, 6), matrices, i % 2 ? '#456e51' : '#63855d'));
}
box('decor', [0.5, 2.1, -2.08], [1.2, 0.8, 0.04], '#284653');
box('decor', [0.32, 2.08, -2.05], [0.08, 0.42, 0.02], colors.orange);
box('decor', [0.6, 2.08, -2.05], [0.08, 0.56, 0.02], '#acc6bc');
for (const [name, geometries] of parts) {
  const merged = mergeGeometries(geometries, false);
  const mesh = new T.Mesh(merged, material); mesh.name = `${name}Mesh`;
  const group = new T.Group(); group.name = name; group.add(mesh); root.add(group);
}

const exporter = new GLTFExporter();
const buffer = await exporter.parseAsync(root, { binary: true, onlyVisible: false });
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const document = await io.readBinary(new Uint8Array(buffer));
document.createExtension(EXTTextureWebP).setRequired(true);
// 256px light/AO texture is baked once and shared by the merged parts.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><radialGradient id="a"><stop stop-color="white"/><stop offset=".65" stop-color="#fafafa"/><stop offset="1" stop-color="#c4c8c7"/></radialGradient></defs><rect width="256" height="256" fill="url(#a)"/></svg>`;
const atlas = await sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer();
const texture = document.createTexture('BakedAO').setImage(atlas).setMimeType('image/webp');
for (const mat of document.getRoot().listMaterials()) mat.setBaseColorTexture(texture);
await document.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
await fs.mkdir('public/scene', { recursive: true });
await io.write('public/scene/room.meshopt.glb', document);
const bytes = (await fs.stat('public/scene/room.meshopt.glb')).size;
const summary = { bytes, textureSize: 256, parts: root.children.length, merged: true, instancedParts: 2, lighting: 'offline vertex lighting and shared baked AO texture; KHR_materials_unlit; no runtime lights/shadows' };
await fs.writeFile('public/scene/model-info.json', JSON.stringify(summary, null, 2));
if (bytes > 3 * 1024 * 1024) throw new Error('Model exceeds 3 MB');
console.log(JSON.stringify(summary));
