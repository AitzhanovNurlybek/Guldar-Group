"""Проверка окружения рендера: устройства Cycles и габариты моделей из кэша.
blender -b --factory-startup -P render/inspect_assets.py"""

import glob
import os

import bpy
from mathutils import Vector

CACHE = os.path.join(os.path.expanduser("~"), "render-cache", "guldar")

prefs = bpy.context.preferences.addons["cycles"].preferences
for kind in ("OPTIX", "CUDA"):
    try:
        prefs.compute_device_type = kind
        prefs.get_devices()
        devs = [d.name for d in prefs.devices if d.type == kind]
        print(f"[dev] {kind}: {devs}")
    except TypeError as e:
        print(f"[dev] {kind}: нет ({e})")

for path in sorted(glob.glob(os.path.join(CACHE, "models", "*", "*.gltf"))):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    tris = 0
    for o in meshes:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
        tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
    d = hi - lo
    name = os.path.basename(os.path.dirname(path))
    print(f"[model] {name}: {d.x:.2f} x {d.y:.2f} x {d.z:.2f} м (x,y,z; z вверх), низ z={lo.z:.2f}, объектов {len(meshes)}, треугольников {tris}")
