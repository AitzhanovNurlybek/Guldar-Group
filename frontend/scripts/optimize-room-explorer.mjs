import fs from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, flatten, join, meshopt, prune, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import { Color, Matrix4 } from "three";

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const document = await io.read("reports/room-export/room-complete.glb");
for (const node of [...document.getRoot().listNodes()]) {
  if (Math.abs(new Matrix4().fromArray(node.getWorldMatrix()).determinant()) < 1e-8) node.dispose();
}
for (const material of document.getRoot().listMaterials()) {
  if (material.getName() === "floor") {
    const texture = material.getBaseColorTexture();
    if (texture?.getImage()) texture.setImage(await sharp(texture.getImage()).modulate({ saturation: 0.12, brightness: 1.45 }).webp({ quality: 86 }).toBuffer()).setMimeType("image/webp");
    material.setRoughnessFactor(0.5).setMetallicFactor(0);
  }
  if (material.getName() === "wall") material.setBaseColorTexture(null).setBaseColorFactor([...new Color("#436c78").toArray(), 1]);
}
await document.transform(
  dedup(), prune(), flatten(), prune(), join(), weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.35, error: 0.001, lockBorder: true }),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [512, 512] }),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);
await io.write("public/scene/room-complete.glb", document);
const bytes = (await fs.stat("public/scene/room-complete.glb")).size;
const summary = { bytes, meshes: document.getRoot().listMeshes().length, materials: document.getRoot().listMaterials().length, textures: document.getRoot().listTextures().length, source: "Existing Blender final room", loading: "Only after explicit visitor action" };
await fs.writeFile("public/scene/room-complete-info.json", JSON.stringify(summary, null, 2));
console.log(summary);
