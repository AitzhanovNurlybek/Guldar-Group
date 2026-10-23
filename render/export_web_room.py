"""Export the existing final Blender room for the opt-in website viewer."""
from pathlib import Path
import bpy

root = Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(Path.home() / "render-cache/guldar/scene.blend"))
bpy.context.scene.frame_set(144)
bpy.context.view_layer.update()

def image_upstream(socket, seen=None):
    seen = set() if seen is None else seen
    for link in socket.links:
        node = link.from_node
        if node in seen:
            continue
        seen.add(node)
        if node.type == "TEX_IMAGE" and node.image:
            return node
        for input_socket in node.inputs:
            found = image_upstream(input_socket, seen)
            if found:
                return found
    return None

# The repair-wave shader is useful for the film; the web scene uses its final BSDF.
for material in bpy.data.materials:
    if not material.use_nodes:
        continue
    nodes = material.node_tree.nodes
    shaders = [node for node in nodes if node.type == "BSDF_PRINCIPLED"]
    output = next((node for node in nodes if node.type == "OUTPUT_MATERIAL"), None)
    if not shaders or not output:
        continue
    shader = shaders[-1]
    color_image = image_upstream(shader.inputs["Base Color"])
    if color_image:
        material.node_tree.links.new(color_image.outputs["Color"], shader.inputs["Base Color"])
    material.node_tree.links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    if "Transmission Weight" in shader.inputs:
        shader.inputs["Transmission Weight"].default_value = 0
    if "glass" in material.name.lower() or material.name == "film":
        shader.inputs["Alpha"].default_value = 0.12
        material.surface_render_method = "DITHERED"

for image in bpy.data.images:
    width, height = image.size
    if width and height and max(width, height) > 512 and image.source == "FILE":
        factor = 512 / max(width, height)
        image.scale(max(1, round(width * factor)), max(1, round(height * factor)))

bpy.ops.object.select_all(action="DESELECT")
count = triangles = 0
for obj in bpy.context.scene.objects:
    if obj.type not in {"MESH", "FONT", "CURVE"} or obj.hide_render:
        continue
    scale = obj.matrix_world.to_scale()
    if max(abs(value) for value in scale) < 0.02:
        continue
    obj.hide_set(False)
    obj.select_set(True)
    count += 1
    if obj.type == "MESH":
        triangles += sum(max(0, len(poly.vertices) - 2) for poly in obj.data.polygons)

output = root / "frontend/reports/room-export"
output.mkdir(parents=True, exist_ok=True)
print(f"EXPORT: {count} objects, approximately {triangles} triangles", flush=True)
bpy.ops.export_scene.gltf(
    filepath=str(output / "room-complete.glb"), export_format="GLB", use_selection=True,
    export_animations=False, export_current_frame=True, export_cameras=False, export_lights=False,
    export_apply=True, export_image_format="AUTO", export_extras=False,
)
print("EXPORT_DONE", flush=True)
