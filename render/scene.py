"""
Фото-рендер фона сайта GulDar Group: коммерческое помещение в разрезе — от черновой коробки до готового интерьера.
Сюжет по кадрам (прогресс прокрутки p = 0…1):
  0.00  черновое помещение: кирпич, бетон, строительные прожекторы и лампочки, инструмент, мусор;
  0.06–0.30  стены: штукатурка и покраска поднимаются снизу вверх (светящаяся оранжевая кромка);
  0.30–0.48  пол: плитка расходится из дальнего угла, инвентарь убирают по мере прохода кромки;
  0.48–0.62  электрика и свет: опускаются светильники, стройсвет гаснет, загорается чистовой;
  0.60–0.68  витрина: снимают плёнку, ставят стекло;
  0.66–0.90  мебель и декор; 0.86–0.96 — вывеска загорается; дальше — финальный план.
Ассеты — CC0 Poly Haven (render/fetch_assets.py), шрифт — Manrope (OFL).

Запуск:
  blender -b --factory-startup -P render/scene.py -- --test            пробные кадры (50 %, 48 сэмплов)
  blender -b --factory-startup -P render/scene.py -- --render          все кадры в кэш
  параметры: --frames 1-144  --res 100  --samples 128  --out <папка>
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

ARGV = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def opt(name, default=None):
    return ARGV[ARGV.index(name) + 1] if name in ARGV and ARGV.index(name) + 1 < len(ARGV) else default


CACHE = os.path.join(os.path.expanduser("~"), "render-cache", "guldar")
N = 144  # кадров на всю прокрутку
ORANGE = (0.961, 0.529, 0.122)


def F(p):
    return 1 + round(max(0.0, min(1.0, p)) * (N - 1))


def rad(d):
    return math.radians(d)


bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
col = sc.collection

# ─── Рендер ────────────────────────────────────────────────────────────────
sc.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
# CUDA: для OptiX в Blender 5.2 драйвер NVIDIA 551 слишком старый (ядро не компилируется)
for kind in (opt("--device", "CUDA"), "CUDA"):
    try:
        prefs.compute_device_type = kind
        prefs.get_devices()
        if any(d.type == kind for d in prefs.devices):
            for d in prefs.devices:
                d.use = d.type == kind
            break
    except TypeError:
        pass
sc.cycles.device = "GPU"
sc.cycles.samples = int(opt("--samples", 128))
sc.cycles.use_adaptive_sampling = True
sc.cycles.adaptive_threshold = 0.02
sc.cycles.use_denoising = True
sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.max_bounces = 8
sc.cycles.diffuse_bounces = 4
sc.cycles.glossy_bounces = 4
sc.cycles.transmission_bounces = 8
sc.cycles.transparent_max_bounces = 8
sc.cycles.caustics_reflective = False
sc.cycles.caustics_refractive = False
sc.cycles.blur_glossy = 1.0
sc.render.film_transparent = True
sc.cycles.film_transparent_glass = True  # сквозь стекло витрины — фон сайта, а не студийная HDRI
sc.render.resolution_x = 1320
sc.render.resolution_y = 1200
sc.render.resolution_percentage = int(opt("--res", 100))
sc.render.use_persistent_data = True
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"
sc.frame_start, sc.frame_end = 1, N
sc.view_settings.view_transform = "AgX"
for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
    try:
        sc.view_settings.look = look
        break
    except TypeError:
        pass

# ─── Помощники: геометрия ──────────────────────────────────────────────────


def link(obj):
    col.objects.link(obj)
    return obj


def box(name, x0, x1, y0, y1, z0, z1, mat, bevel=0.0):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = x0 if v.co.x < 0 else x1
        v.co.y = y0 if v.co.y < 0 else y1
        v.co.z = z0 if v.co.z < 0 else z1
    # UV в метрах по большей грани — текстуры ложатся без растяжения
    uv = bm.loops.layers.uv.new()
    for f in bm.faces:
        n = f.normal
        for lp in f.loops:
            c = lp.vert.co
            lp[uv].uv = (c.y, c.z) if abs(n.x) > 0.5 else (c.x, c.z) if abs(n.y) > 0.5 else (c.x, c.y)
    bm.to_mesh(me)
    bm.free()
    o = link(bpy.data.objects.new(name, me))
    o.data.materials.append(mat)
    if bevel:
        m = o.modifiers.new("bevel", "BEVEL")
        m.width = bevel
        m.segments = 2
        m.limit_method = "ANGLE"
    for p in o.data.polygons:
        p.use_smooth = False
    return o


def quad(name, corners, uv_axes, mat):
    """Плоскость по четырём углам; UV — мировые координаты по осям uv_axes (метры)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vs = [bm.verts.new(c) for c in corners]
    f = bm.faces.new(vs)
    uv = bm.loops.layers.uv.new()
    for lp in f.loops:
        c = lp.vert.co
        lp[uv].uv = (c[uv_axes[0]], c[uv_axes[1]])
    bm.to_mesh(me)
    bm.free()
    o = link(bpy.data.objects.new(name, me))
    o.data.materials.append(mat)
    return o


def cyl(name, loc, r, h, mat, verts=24, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return o


def empty(name, loc=(0, 0, 0)):
    e = link(bpy.data.objects.new(name, None))
    e.location = loc
    return e


def world_of(o):
    """Мировая матрица без обновления depsgraph (у только что созданных объектов matrix_world ещё единичная)."""
    m = o.matrix_basis.copy()
    if o.parent:
        m = world_of(o.parent) @ o.matrix_parent_inverse @ m
    return m


def parent(child, par):
    w = world_of(child)
    child.parent = par
    child.matrix_parent_inverse = world_of(par).inverted()
    child.matrix_basis = w


def rod(name, a, b, r, mat, verts=12):
    """Цилиндр от точки a до точки b."""
    a, b = Vector(a), Vector(b)
    d = b - a
    o = cyl(name, (a + b) / 2, r, d.length, mat, verts)
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    return o


# ─── Помощники: материалы ──────────────────────────────────────────────────


def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    return m, nt, out


def img(path, noncolor=False):
    im = bpy.data.images.load(path, check_existing=True)
    if noncolor:
        im.colorspace_settings.name = "Non-Color"
    return im


def mix_rgb(nt, blend, fac=1.0):
    """Нода Mix в режиме цвета: (нода, вход A, вход B, выход)."""
    n = nt.nodes.new("ShaderNodeMix")
    n.data_type = "RGBA"
    n.blend_type = blend
    next(i for i in n.inputs if i.name == "Factor" and i.type == "VALUE").default_value = fac
    a = next(i for i in n.inputs if i.name == "A" and i.type == "RGBA")
    b = next(i for i in n.inputs if i.name == "B" and i.type == "RGBA")
    out = next(o for o in n.outputs if o.type == "RGBA")
    return n, a, b, out


def pbr(nt, tex, repeat, tint=None, rough_mul=1.0, nstrength=1.0, rot=0.0, sat=1.0, val=1.0):
    """Principled BSDF с фото-текстурой Poly Haven: цвет × AO, шероховатость, нормали. repeat — метров на повтор."""
    base = os.path.join(CACHE, "textures", tex, tex)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / repeat, 1 / repeat, 1)
    mp.inputs["Rotation"].default_value = (0, 0, rot)
    nt.links.new(tc.outputs["UV"], mp.inputs["Vector"])

    def t(suffix, noncolor):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = img(f"{base}_{suffix}_2k.jpg", noncolor)
        nt.links.new(mp.outputs["Vector"], n.inputs["Vector"])
        return n

    bs = nt.nodes.new("ShaderNodeBsdfPrincipled")
    diff = t("diff", False)
    ao = t("ao", True)
    _, a, b, color = mix_rgb(nt, "MULTIPLY", 0.8)
    nt.links.new(diff.outputs["Color"], a)
    nt.links.new(ao.outputs["Color"], b)
    if sat != 1.0 or val != 1.0:
        hs = nt.nodes.new("ShaderNodeHueSaturation")
        hs.inputs["Saturation"].default_value = sat
        hs.inputs["Value"].default_value = val
        nt.links.new(color, hs.inputs["Color"])
        color = hs.outputs["Color"]
    if tint is not None:
        _, a, b, out = mix_rgb(nt, "MULTIPLY", 1.0)
        nt.links.new(color, a)
        b.default_value = (*tint, 1)
        color = out
    nt.links.new(color, bs.inputs["Base Color"])
    rough = t("rough", True)
    if rough_mul != 1.0:
        rm = nt.nodes.new("ShaderNodeMath")
        rm.operation = "MULTIPLY"
        rm.inputs[1].default_value = rough_mul
        nt.links.new(rough.outputs["Color"], rm.inputs[0])
        nt.links.new(rm.outputs[0], bs.inputs["Roughness"])
    else:
        nt.links.new(rough.outputs["Color"], bs.inputs["Roughness"])
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = nstrength
    nt.links.new(t("nor_gl", True).outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], bs.inputs["Normal"])
    return bs


def simple(name, color, rough=0.5, metal=0.0, emission=None, estrength=0.0, transmission=0.0, alpha=1.0):
    m, nt, out = new_mat(name)
    bs = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bs.inputs["Base Color"].default_value = (*color, 1)
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = metal
    if transmission:
        bs.inputs["Transmission Weight"].default_value = transmission
    if alpha < 1:
        bs.inputs["Alpha"].default_value = alpha
    if emission:
        bs.inputs["Emission Color"].default_value = (*emission, 1)
        bs.inputs["Emission Strength"].default_value = estrength
    nt.links.new(bs.outputs["BSDF"], out.inputs["Surface"])
    return m


def textured(name, tex, repeat, **kw):
    m, nt, out = new_mat(name)
    nt.links.new(pbr(nt, tex, repeat, **kw).outputs["BSDF"], out.inputs["Surface"])
    return m


def key_value(sock, frames_values, interp="LINEAR"):
    """Ключи для входа ноды (сила свечения, фронт волны) — по кадрам."""
    for f, v in frames_values:
        sock.default_value = v
        sock.keyframe_insert("default_value", frame=f)
    return interp


# ─── Волна ремонта: маска «готово» и светящаяся кромка ────────────────────


def wave_group(name, coord):
    """coord: 'z' — снизу вверх (стены), 'diag' — из дальнего левого угла к ближнему правому (пол)."""
    ng = bpy.data.node_groups.new(name, "ShaderNodeTree")
    ng.interface.new_socket("Mask", in_out="OUTPUT", socket_type="NodeSocketFloat")
    ng.interface.new_socket("Seam", in_out="OUTPUT", socket_type="NodeSocketFloat")
    N_ = ng.nodes
    L = ng.links.new
    out = N_.new("NodeGroupOutput")
    geo = N_.new("ShaderNodeNewGeometry")
    sep = N_.new("ShaderNodeSeparateXYZ")
    L(geo.outputs["Position"], sep.inputs[0])

    def math_(op, a, b=None):
        n = N_.new("ShaderNodeMath")
        n.operation = op
        for i, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                L(v, n.inputs[i])
        return n.outputs[0]

    if coord == "z":
        c = sep.outputs["Z"]
    else:
        c = math_("ADD", math_("ADD", sep.outputs["X"], 3.0), math_("SUBTRACT", 2.5, sep.outputs["Y"]))
    # Неровный фронт — как настоящая работа, а не линейка
    noise = N_.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 1.6
    noise.inputs["Detail"].default_value = 3
    L(geo.outputs["Position"], noise.inputs["Vector"])
    c = math_("ADD", c, math_("MULTIPLY", math_("SUBTRACT", noise.outputs["Fac"], 0.5), 0.22))
    front = N_.new("ShaderNodeValue")
    front.name = front.label = "front"
    front.outputs[0].default_value = -5
    diff = math_("SUBTRACT", c, front.outputs[0])
    mr = N_.new("ShaderNodeMapRange")
    mr.interpolation_type = "SMOOTHSTEP"
    mr.inputs["From Min"].default_value = -0.025
    mr.inputs["From Max"].default_value = 0.025
    mr.inputs["To Min"].default_value = 1.0
    mr.inputs["To Max"].default_value = 0.0
    L(diff, mr.inputs["Value"])
    L(mr.outputs["Result"], out.inputs["Mask"])
    seam = math_("EXPONENT", math_("MULTIPLY", math_("POWER", math_("DIVIDE", diff, 0.045), 2.0), -1.0))
    L(seam, out.inputs["Seam"])
    return ng, front.outputs[0]


def wave_material(name, group, raw, fin, feature=None, seam_strength=9.0):
    """raw/fin — функции (nt) → Principled; feature=(x0, x1, rgb) — участок готовой стены другого цвета."""
    m, nt, out = new_mat(name)
    r = raw(nt)
    f = fin(nt)
    if feature:
        x0, x1, rgb = feature
        geo = nt.nodes.new("ShaderNodeNewGeometry")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(geo.outputs["Position"], sep.inputs[0])
        inside = nt.nodes.new("ShaderNodeMapRange")
        inside.inputs["From Min"].default_value = x0
        inside.inputs["From Max"].default_value = x0 + 0.004
        nt.links.new(sep.outputs["X"], inside.inputs["Value"])
        before = nt.nodes.new("ShaderNodeMapRange")
        before.inputs["From Min"].default_value = x1
        before.inputs["From Max"].default_value = x1 + 0.004
        before.inputs["To Min"].default_value = 1
        before.inputs["To Max"].default_value = 0
        nt.links.new(sep.outputs["X"], before.inputs["Value"])
        band = nt.nodes.new("ShaderNodeMath")
        band.operation = "MULTIPLY"
        nt.links.new(inside.outputs["Result"], band.inputs[0])
        nt.links.new(before.outputs["Result"], band.inputs[1])
        base_link = f.inputs["Base Color"].links[0]
        src = base_link.from_socket
        mix, a, b, out_c = mix_rgb(nt, "MULTIPLY", 0.0)
        nt.links.new(band.outputs[0], next(i for i in mix.inputs if i.name == "Factor" and i.type == "VALUE"))
        nt.links.new(src, a)
        b.default_value = (*rgb, 1)
        nt.links.new(out_c, f.inputs["Base Color"])
    g = nt.nodes.new("ShaderNodeGroup")
    g.node_tree = group
    mx = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(g.outputs["Mask"], mx.inputs["Fac"])
    nt.links.new(r.outputs["BSDF"], mx.inputs[1])
    nt.links.new(f.outputs["BSDF"], mx.inputs[2])
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*ORANGE, 1)
    st = nt.nodes.new("ShaderNodeMath")
    st.operation = "MULTIPLY"
    st.inputs[1].default_value = seam_strength
    nt.links.new(g.outputs["Seam"], st.inputs[0])
    nt.links.new(st.outputs[0], em.inputs["Strength"])
    add = nt.nodes.new("ShaderNodeAddShader")
    nt.links.new(mx.outputs["Shader"], add.inputs[0])
    nt.links.new(em.outputs["Emission"], add.inputs[1])
    nt.links.new(add.outputs["Shader"], out.inputs["Surface"])
    return m


# ─── Анимация появления и уборки ──────────────────────────────────────────


def kf(obj, frame, loc=None, scale=None, rot=None):
    if loc is not None:
        obj.location = loc
        obj.keyframe_insert("location", frame=frame)
    if scale is not None:
        obj.scale = scale
        obj.keyframe_insert("scale", frame=frame)
    if rot is not None:
        obj.rotation_euler = rot
        obj.keyframe_insert("rotation_euler", frame=frame)


def appear(obj, p, drop=0.5):
    """Предмет ставят: опускается сверху, касается пола и чуть подпрыгивает."""
    f = F(p)
    base = obj.location.copy()
    s = obj.scale.copy()
    up = Vector((0, 0, drop))
    kf(obj, 1, loc=base + up, scale=(0, 0, 0))
    kf(obj, f - 1, loc=base + up, scale=(0, 0, 0))
    kf(obj, f, loc=base + up * 0.85, scale=s)
    kf(obj, f + 3, loc=base, scale=s)
    kf(obj, f + 4, loc=base + up * 0.06, scale=s)
    kf(obj, f + 5, loc=base, scale=s)


def remove(obj, p):
    """Предмет убирают: уходит вниз и сжимается за три кадра."""
    f = F(p)
    base = obj.location.copy()
    s = obj.scale.copy()
    kf(obj, f - 3, loc=base, scale=s)
    kf(obj, f, loc=base - Vector((0, 0, 0.12)), scale=(0, 0, 0))


# ─── Ассеты Poly Haven ────────────────────────────────────────────────────


def load(name, loc, rot=0.0, scale=1.0, tilt=(0.0, 0.0)):
    path = os.path.join(CACHE, "models", name, f"{name}_1k.gltf")
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    root = empty(name, loc)
    root.rotation_euler = (rad(tilt[0]), rad(tilt[1]), rad(rot))
    root.scale = (scale, scale, scale)
    for o in new:
        if o.parent is None:
            o.parent = root
    return root


# ═══ Сцена ═════════════════════════════════════════════════════════════════

X0, X1 = -3.0, 3.0  # внутренний объём помещения
Y0, Y1 = -2.5, 2.5
H = 3.0

# Разрез: плита и стены — гладкий бетон
section = textured("section", "concrete_wall_008", 2.0, tint=(0.36, 0.38, 0.41))
box("slab", X0 - 0.25, X1 + 0.12, Y0 - 0.1, Y1 + 0.25, -0.34, 0.0, section, bevel=0.01)
box("wall_back", X0 - 0.25, X1 + 0.12, Y1, Y1 + 0.25, 0.0, H, section, bevel=0.008)

# Стены: черновой кирпич с пятнами штукатурки → белая штукатурка и синяя фирменная стена
walls_ng, walls_front = wave_group("wave_walls", "z")
wall_mat = wave_material(
    "wall",
    walls_ng,
    lambda nt: pbr(nt, "rough_plaster_brick_04", 2.4),
    lambda nt: pbr(nt, "painted_plaster_wall", 2.2, tint=(0.94, 0.94, 0.93), rough_mul=1.1, nstrength=0.35),
    feature=(-3.3, -0.35, (0.13, 0.36, 0.58)),
)
quad("wall_face", [(X0, Y1 - 0.001, 0), (X1 + 0.12, Y1 - 0.001, 0), (X1 + 0.12, Y1 - 0.001, H), (X0, Y1 - 0.001, H)], (0, 2), wall_mat)

# Пол: изношенная стяжка → крупноформатный керамогранит
FLOOR = opt("--floor", "smooth_concrete_floor")
FLOOR_REPEAT = {"smooth_concrete_floor": 3.0, "large_grey_tiles": 2.4, "marble_tiles": 2.0, "interior_tiles": 1.6, "grey_tiles": 1.6, "terrazzo_tiles": 1.8}
floor_ng, floor_front = wave_group("wave_floor", "diag")
floor_mat = wave_material(
    "floor",
    floor_ng,
    lambda nt: pbr(nt, "concrete_floor_worn_001", 3.0, tint=(0.9, 0.9, 0.9)),
    # Полированный бетон (микроцемент): светло-серый, с сатиновым бликом
    lambda nt: pbr(nt, FLOOR, FLOOR_REPEAT.get(FLOOR, 2.0), rough_mul=0.5, nstrength=0.5, sat=0.12, val=1.45),
)
quad("floor_face", [(X0, Y0 - 0.1, 0.001), (X1 + 0.12, Y0 - 0.1, 0.001), (X1 + 0.12, Y1, 0.001), (X0, Y1, 0.001)], (0, 1), floor_mat)

# Витрина слева: цоколь и ригель — бетон, стойки и импосты — тёмный металл
steel = simple("steel_dark", (0.045, 0.05, 0.055), rough=0.38, metal=0.85)
box("storefront_plinth", X0 - 0.25, X0, Y0 - 0.1, Y1 + 0.25, 0, 0.35, section, bevel=0.006)
box("storefront_head", X0 - 0.25, X0, Y0 - 0.1, Y1 + 0.25, 2.6, H, section, bevel=0.006)
for y in (-2.5, -0.85, 0.85, 2.45):
    box(f"mullion_{y}", X0 - 0.16, X0 - 0.06, y - 0.05, y + 0.05, 0.35, 2.6, steel, bevel=0.004)
for z in (0.35, 2.6):
    box(f"transom_{z}", X0 - 0.16, X0 - 0.06, Y0 - 0.05, Y1 - 0.05, z - 0.04, z + 0.04, steel, bevel=0.004)
BAYS = [(-2.45, -0.9), (-0.8, 0.8), (0.9, 2.4)]

# Потолочные балки-двутавры — на них висит и стройсвет, и светильники
BEAM_Y, BEAM_B = 1.4, H - 0.2  # ось и низ балки
box("beam_top", X0 - 0.25, X1 + 0.12, BEAM_Y - 0.06, BEAM_Y + 0.06, H - 0.016, H, steel)
box("beam_web", X0 - 0.25, X1 + 0.12, BEAM_Y - 0.005, BEAM_Y + 0.005, BEAM_B + 0.016, H - 0.016, steel)
box("beam_bot", X0 - 0.25, X1 + 0.12, BEAM_Y - 0.06, BEAM_Y + 0.06, BEAM_B, BEAM_B + 0.016, steel)

# ─── Свет ─────────────────────────────────────────────────────────────────
world = bpy.data.worlds.new("world")
sc.world = world
world.use_nodes = True
wn = world.node_tree
bg = wn.nodes["Background"]
env = wn.nodes.new("ShaderNodeTexEnvironment")
env.image = img(os.path.join(CACHE, "hdri", "brown_photostudio_02_2k.hdr"))
wn.links.new(env.outputs["Color"], bg.inputs["Color"])
key_value(bg.inputs["Strength"], [(1, 0.14), (F(0.5), 0.14), (F(0.64), 0.34)])


def area(name, loc, target, size, power, color):
    d = bpy.data.lights.new(name, "AREA")
    d.shape = "DISK"
    d.size = size
    d.energy = power
    d.color = color
    o = link(bpy.data.objects.new(name, d))
    o.location = loc
    look = o.constraints.new("TRACK_TO")
    look.target = empty(name + "_target", target)
    return o


# Студийный «ключ» сверху-справа-спереди и холодный контровой слева-сзади — свет макета
key_area = area("key", (6.5, -6.5, 9.0), (0, 0.5, 0), 5.0, 1500, (1.0, 0.96, 0.9))
area("rim", (-6.0, 6.5, 6.0), (0, 0, 1), 4.0, 600, (0.75, 0.85, 1.0))


def point(name, loc, power, color, radius=0.05):
    d = bpy.data.lights.new(name, "POINT")
    d.energy = power
    d.color = color
    d.shadow_soft_size = radius
    o = link(bpy.data.objects.new(name, d))
    o.location = loc
    return o, d


def key_light(data, frames_values):
    for f, v in frames_values:
        data.energy = v
        data.keyframe_insert("energy", frame=f)


# ─── Черновое состояние: стройсвет ─────────────────────────────────────────
bulb_glass = simple("bulb_warm", (1, 0.9, 0.7), rough=0.1, emission=(1.0, 0.72, 0.4), estrength=30)
key_value(bulb_glass.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"], [(1, 30), (F(0.52), 30), (F(0.58), 0)])
cord = simple("cord", (0.02, 0.02, 0.02), rough=0.6)
raw_lights = []
for i, x in enumerate((-1.5, 0.4, 2.3)):
    y = BEAM_Y
    g = empty(f"bulb_{i}", (x, y, 0))
    c = cyl(f"bulb_cord_{i}", (x, y, BEAM_B - 0.45), 0.006, 0.9, cord, 8)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, location=(x, y, BEAM_B - 0.94))
    b = bpy.context.object
    b.data.materials.append(bulb_glass)
    bpy.ops.object.shade_smooth()
    lo, ld = point(f"bulb_light_{i}", (x, y, BEAM_B - 0.94), 55, (1.0, 0.72, 0.42), 0.04)
    key_light(ld, [(1, 55), (F(0.52), 55), (F(0.58), 0)])
    for o in (c, b, lo):
        parent(o, g)
    raw_lights.append(g)

# Прожекторы на треногах
lamp_face = simple("floodlight_face", (1, 1, 1), rough=0.2, emission=(0.9, 0.95, 1.0), estrength=45)
key_value(lamp_face.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"], [(1, 45), (F(0.52), 45), (F(0.58), 0)])
yellow = simple("tripod_yellow", (0.8, 0.55, 0.05), rough=0.45, metal=0.2)
housing = simple("flood_housing", (0.05, 0.05, 0.05), rough=0.35, metal=0.6)
for i, (x, y, aim) in enumerate([(2.35, -1.55, (-0.8, 2.4, 1.2)), (-2.2, 0.9, (1.8, -0.4, 0.6))]):
    g = empty(f"tripod_{i}", (x, y, 0))
    top = (x, y, 0.95)
    for a in range(3):
        ang = a * 2 * math.pi / 3 + 0.4
        parent(rod(f"tripod_{i}_leg{a}", (x + 0.38 * math.cos(ang), y + 0.38 * math.sin(ang), 0.0), top, 0.011, yellow, 8), g)
    parent(rod(f"tripod_{i}_pole", top, (x, y, 1.5), 0.014, yellow, 8), g)
    hd = empty(f"tripod_{i}_aim", (x, y, 1.58))
    to = Vector(aim) - Vector((x, y, 1.58))
    parent(box(f"tripod_{i}_head", x - 0.17, x + 0.17, y - 0.06, y + 0.06, 1.46, 1.7, housing, bevel=0.012), hd)
    parent(box(f"tripod_{i}_face", x - 0.15, x + 0.15, y - 0.066, y - 0.06, 1.48, 1.68, lamp_face), hd)
    parent(box(f"tripod_{i}_fins", x - 0.15, x + 0.15, y + 0.06, y + 0.1, 1.48, 1.68, housing), hd)
    parent(rod(f"tripod_{i}_yoke", (x - 0.19, y, 1.5), (x + 0.19, y, 1.5), 0.008, yellow, 8), hd)
    hd.rotation_euler = (rad(-18), 0, math.atan2(to.x, -to.y))
    parent(hd, g)
    sd = bpy.data.lights.new(f"flood_{i}", "SPOT")
    sd.energy = 1400
    sd.spot_size = rad(75)
    sd.spot_blend = 0.6
    sd.shadow_soft_size = 0.12
    sd.color = (0.92, 0.96, 1.0)
    so = link(bpy.data.objects.new(f"flood_{i}", sd))
    so.location = (x, y, 1.58)
    tr = so.constraints.new("TRACK_TO")
    tr.target = empty(f"flood_{i}_target", aim)
    key_light(sd, [(1, 1400), (F(0.52), 1400), (F(0.58), 0)])
    parent(so, g)
    raw_lights.append(g)
for g in raw_lights:
    remove(g, 0.62)
key_light(key_area.data, [(1, 1500), (F(0.5), 1500), (F(0.64), 2100)])
sc.view_settings.exposure = 0.15
sc.view_settings.keyframe_insert("exposure", frame=1)
sc.view_settings.keyframe_insert("exposure", frame=F(0.5))
sc.view_settings.exposure = 0.35
sc.view_settings.keyframe_insert("exposure", frame=F(0.66))

# ─── Черновое состояние: инвентарь, стройматериалы, мусор ────────────────
raw_props = []


def raw(name, loc, **kw):
    o = load(name, loc, **kw)
    raw_props.append(o)
    return o


raw("ladder_sectioned_01", (1.95, 2.02, 0), rot=0, tilt=(-14, 0))
raw("tool_cart", (2.15, 0.35, 0), rot=-25)
raw("metal_toolbox", (0.75, -1.05, 0), rot=32)
raw("cross_pein_hammer", (0.35, -1.35, 0.02), rot=70, tilt=(90, 0))
raw("adjustable_wrench", (0.52, -1.5, 0.015), rot=-20, tilt=(90, 0))
raw("portable_generator", (-1.95, 1.75, 0), rot=-12)
raw("wooden_crate_01", (-0.35, 1.7, 0), rot=8)
raw("plastic_crate_02", (-2.25, -1.3, 0), rot=15)
raw("plastic_crate_01", (-2.22, -1.28, 0.25), rot=24)
raw("cardboard_box_01", (2.45, 1.95, 0), rot=10)
raw("cardboard_box_01", (2.5, 1.45, 0), rot=-6)
raw("cardboard_box_01", (2.47, 1.72, 0.34), rot=30)
raw("spray_paint_bottles", (-0.1, 1.72, 0.35), rot=-30)
raw("sledgehammer_01", (0.55, 2.38, 0.75), rot=0, tilt=(-8, 0))
wall_props = [load("power_box_01", (-0.8, 2.32, 1.45), rot=0), load("modular_electric_cables", (-0.2, 2.4, 0.0), rot=0)]

# Мешки со смесью, вёдра, гипсокартон у стены, куча строительного мусора
sack = textured("sack", "concrete_floor_worn_001", 0.8, tint=(0.85, 0.8, 0.7))
for i, (x, y, z, r) in enumerate([(-1.25, -1.65, 0.0, 5), (-0.85, -1.62, 0.0, -8), (-1.05, -1.66, 0.14, 12)]):
    s = box(f"sack_{i}", -0.2, 0.2, -0.28, 0.28, 0, 0.14, sack, bevel=0.05)
    s.location = (x, y, z)
    s.rotation_euler = (0, 0, rad(r))
    raw_props.append(s)
bucket_white = simple("bucket_white", (0.85, 0.86, 0.87), rough=0.35)
bucket_orange = simple("bucket_orange", ORANGE, rough=0.4)
for i, (x, y, m) in enumerate([(0.15, 0.25, bucket_white), (0.5, 0.4, bucket_orange), (0.28, 0.62, bucket_white)]):
    b = cyl(f"bucket_{i}", (x, y, 0.17), 0.15, 0.34, m, 32)
    b.scale = (1, 1, 1)
    raw_props.append(b)
gypsum = simple("gypsum", (0.86, 0.86, 0.84), rough=0.9)
for i in range(3):
    g = box(f"gypsum_{i}", -0.6, 0.6, -0.006, 0.006, 0, 2.5, gypsum)
    g.location = (-1.55 + i * 0.04, 2.3 - i * 0.02, 0)
    g.rotation_euler = (rad(-8 - i), 0, 0)
    raw_props.append(g)
debris_mat = textured("debris", "concrete_floor_worn_001", 0.6, tint=(0.7, 0.66, 0.6))
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=0.5, location=(-2.35, 2.05, 0))
pile = bpy.context.object
pile.name = "debris"
pile.scale = (1.1, 0.8, 0.32)
tex = bpy.data.textures.new("debris_noise", "CLOUDS")
tex.noise_scale = 0.18
dm = pile.modifiers.new("disp", "DISPLACE")
dm.texture = tex
dm.strength = 0.25
pile.data.materials.append(debris_mat)
bpy.ops.object.shade_smooth()
raw_props.append(pile)

# Защитная плёнка на проёмах витрины — снимают перед установкой стекла
film = simple("film", (0.92, 0.94, 0.96), rough=0.35, transmission=0.85)
films = []
for i, (y0, y1) in enumerate(BAYS):
    f_ = box(f"film_{i}", X0 - 0.05, X0 - 0.045, y0, y1, 0.4, 2.55, film)
    films.append(f_)

# Уборка: стройинвентарь исчезает, когда кромка пола доходит до него
FLOOR_P0, FLOOR_P1, FLOOR_D = 0.30, 0.48, 11.5
for o in raw_props:
    x, y = o.location.x, o.location.y
    d = (x + 3.0) + (2.5 - y)
    remove(o, FLOOR_P0 + (FLOOR_P1 - FLOOR_P0) * d / FLOOR_D - 0.01)
for o in wall_props:
    remove(o, 0.56)

# ─── Витрина: стекло и дверь ──────────────────────────────────────────────
glass_m, gnt, gout = new_mat("glass")
gb = gnt.nodes.new("ShaderNodeBsdfPrincipled")
gb.inputs["Base Color"].default_value = (0.9, 0.95, 1.0, 1)
gb.inputs["Roughness"].default_value = 0.02
gb.inputs["Transmission Weight"].default_value = 1.0
gb.inputs["IOR"].default_value = 1.2
tr_ = gnt.nodes.new("ShaderNodeBsdfTransparent")
gmix = gnt.nodes.new("ShaderNodeMixShader")
gnt.links.new(tr_.outputs[0], gmix.inputs[1])
gnt.links.new(gb.outputs["BSDF"], gmix.inputs[2])
gnt.links.new(gmix.outputs[0], gout.inputs["Surface"])
key_value(gmix.inputs["Fac"], [(1, 0), (F(0.62), 0), (F(0.68), 1)])
for i, (y0, y1) in enumerate(BAYS):
    box(f"glass_{i}", X0 - 0.12, X0 - 0.1, y0, y1, 0.4, 2.55, glass_m)
chrome = simple("chrome", (0.8, 0.8, 0.8), rough=0.12, metal=1.0)
handle = box("door_handle", -0.01, 0.01, -0.015, 0.015, -0.45, 0.45, chrome, bevel=0.006)
handle.location = (X0 - 0.08, 0.535, 1.3)
appear(handle, 0.68, drop=0.0)

for i, f_ in enumerate(films):
    fr = F(0.6 + i * 0.02)
    # плёнку сворачивают вниз к цоколю
    for fr2, sz in ((fr - 1, 1.0), (fr + 4, 0.0)):
        f_.scale = (1, 1, sz)
        f_.keyframe_insert("scale", frame=fr2)

# ─── Чистовое: свет ───────────────────────────────────────────────────────
warm = (1.0, 0.78, 0.52)
pend_glow = simple("pendant_bulb", (1, 0.9, 0.75), rough=0.2, emission=(1.0, 0.8, 0.55), estrength=0)
key_value(pend_glow.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"], [(1, 0), (F(0.55), 0), (F(0.62), 40)])
fin_lights = []
# Над стойкой — три промышленных подвеса на задней балке
for i, x in enumerate((0.65, 1.2, 1.75)):
    lamp = load("hanging_industrial_lamp", (x, 1.4, H + 0.02))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, location=(x, 1.4, H + 0.02 - 1.25))
    bulb = bpy.context.object
    bulb.data.materials.append(pend_glow)
    lo, ld = point(f"pendant_light_{i}", (x, 1.4, H - 1.28), 0, warm, 0.05)
    key_light(ld, [(1, 0), (F(0.55), 0), (F(0.62), 70)])
    for o in (bulb, lo):
        parent(o, lamp)
    fin_lights.append(lamp)
# Над зоной отдыха — два шара по краям вывески
for i, x in enumerate((-2.85, -0.55)):
    lamp = load("modern_ceiling_lamp_01", (x, 1.4, H - 1.17 + 0.02))
    lo, ld = point(f"ceiling_light_{i}", (x, 1.4, H - 1.17 + 0.25), 0, warm, 0.08)
    key_light(ld, [(1, 0), (F(0.55), 0), (F(0.62), 80)])
    parent(lo, lamp)
    fin_lights.append(lamp)
# Трековые споты на передней балке: подсвечивают вывеску и стеллаж с товаром
spot_body = simple("spot_body", (0.03, 0.03, 0.03), rough=0.4, metal=0.5)
for i, (x, tgt) in enumerate([(-2.2, (-1.7, 2.45, 1.6)), (-1.2, (-1.7, 2.45, 1.5)), (2.55, (2.6, 2.3, 1.1))]):
    p0 = Vector((x, BEAM_Y - 0.08, BEAM_B))
    d = (Vector(tgt) - p0).normalized()
    g = empty(f"track_{i}", tuple(p0))
    head0 = p0 + Vector((0, 0, -0.08))
    parent(rod(f"track_{i}_stem", p0, head0, 0.008, spot_body, 8), g)
    parent(rod(f"track_{i}_can", head0, head0 + d * 0.16, 0.038, spot_body, 16), g)
    sd = bpy.data.lights.new(f"track_{i}", "SPOT")
    sd.energy = 0
    sd.spot_size = rad(38)
    sd.spot_blend = 0.5
    sd.shadow_soft_size = 0.03
    sd.color = warm
    so = link(bpy.data.objects.new(f"track_{i}_light", sd))
    so.location = head0 + d * 0.17
    tr = so.constraints.new("TRACK_TO")
    tr.target = empty(f"track_{i}_target", tgt)
    key_light(sd, [(1, 0), (F(0.55), 0), (F(0.62), 160)])
    parent(so, g)
    fin_lights.append(g)
for i, lamp in enumerate(fin_lights):
    base = lamp.location.copy()
    f0 = F(0.48 + i * 0.01)
    kf(lamp, 1, loc=base + Vector((0, 0, 1.6)), scale=(0, 0, 0))
    kf(lamp, f0 - 1, loc=base + Vector((0, 0, 1.6)), scale=(0, 0, 0))
    kf(lamp, f0, loc=base + Vector((0, 0, 1.4)), scale=(1, 1, 1))
    kf(lamp, f0 + 6, loc=base - Vector((0, 0, 0.04)), scale=(1, 1, 1))
    kf(lamp, f0 + 8, loc=base + Vector((0, 0, 0.015)), scale=(1, 1, 1))
    kf(lamp, f0 + 10, loc=base, scale=(1, 1, 1))

# ─── Чистовое: стойка, стеллаж, зона отдыха, зелень ──────────────────────
wood = textured("wood_slats", "laminate_floor_02", 1.2, rot=rad(90))
marble = textured("marble_top", "marble_01", 1.6, rough_mul=0.5)
plinth = simple("plinth", (0.02, 0.02, 0.025), rough=0.5)

# Стойка с деревянными ламелями и мраморной столешницей, касса
counter = empty("counter", (1.2, 1.45, 0))
parts = [
    box("counter_body", -0.9, 0.9, -0.3, 0.3, 0.1, 1.0, wood, bevel=0.008),
    box("counter_top", -0.95, 0.95, -0.36, 0.34, 1.0, 1.05, marble, bevel=0.006),
    box("counter_plinth", -0.85, 0.85, -0.25, 0.25, 0.0, 0.1, plinth),
]
for i in range(24):
    x = -0.87 + i * 0.0735
    parts.append(box(f"counter_slat_{i}", x, x + 0.05, -0.325, -0.3, 0.12, 0.98, wood, bevel=0.004))
screen_m = simple("pos_screen", (0.02, 0.05, 0.08), rough=0.15, emission=(0.25, 0.55, 0.9), estrength=1.2)
parts.append(box("pos_stand", 0.35, 0.4, 0.05, 0.1, 1.05, 1.25, steel))
parts.append(box("pos_monitor", 0.18, 0.58, 0.0, 0.03, 1.2, 1.46, steel, bevel=0.006))
parts.append(box("pos_screen", 0.2, 0.56, -0.004, 0.0, 1.22, 1.44, screen_m))
for o in parts:
    o.location += counter.location
    parent(o, counter)
parent(load("potted_plant_04", (0.6, 1.3, 1.05), rot=20), counter)
chairs = [load("bar_chair_round_01", (x, 0.82, 0), rot=180 + r) for x, r in ((0.6, 8), (1.2, -4), (1.8, 10))]

# Рейки за стойкой
slats = empty("slat_wall", (1.15, Y1, 0))
for i in range(30):
    x = 0.15 + i * 0.066
    parent(box(f"wall_slat_{i}", x, x + 0.045, Y1 - 0.04, Y1 - 0.005, 0.1, 2.85, wood, bevel=0.003), slats)

# Стеллаж «поставка материалов»: деревянные стенки, белые полки с подсветкой, товар
shelf_m = simple("shelf_white", (0.9, 0.9, 0.88), rough=0.4)
led = simple("led_strip", (1, 1, 1), emission=(1.0, 0.85, 0.65), estrength=0)
key_value(led.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"], [(1, 0), (F(0.8), 0), (F(0.86), 12)])
rack = empty("rack", (2.6, 2.3, 0))
RX0, RX1, RY0, RY1 = 2.2, 3.0, 2.12, 2.47
for x in (RX0, RX1 - 0.03):
    parent(box(f"rack_side_{x}", x, x + 0.03, RY0, RY1, 0, 2.2, wood, bevel=0.004), rack)
for j, z in enumerate((0.12, 0.6, 1.08, 1.56, 2.04)):
    parent(box(f"rack_shelf_{j}", RX0 + 0.03, RX1 - 0.03, RY0, RY1, z, z + 0.028, shelf_m, bevel=0.003), rack)
    if j:
        parent(box(f"rack_led_{j}", RX0 + 0.05, RX1 - 0.05, RY0 + 0.02, RY0 + 0.035, z - 0.006, z, led), rack)
goods = [
    load("cardboard_box_01", (2.4, 2.3, 0.148), rot=90, scale=0.5),
    load("cardboard_box_01", (2.75, 2.3, 0.148), rot=85, scale=0.5),
    load("plastic_crate_01", (2.42, 2.3, 0.628), rot=90, scale=0.75),
    load("spray_paint_bottles", (2.75, 2.28, 0.628), rot=10),
    load("spray_paint_bottles", (2.88, 2.3, 0.628), rot=-15),
    load("metal_toolbox", (2.5, 2.29, 1.108), rot=0, scale=0.8),
    load("adjustable_wrench", (2.83, 2.25, 1.13), rot=90, tilt=(90, 0)),
    load("cardboard_box_01", (2.45, 2.3, 1.588), rot=90, scale=0.42),
    load("cardboard_box_01", (2.8, 2.3, 1.588), rot=80, scale=0.42),
    load("potted_plant_04", (2.6, 2.3, 2.068), rot=0),
]

# Зона отдыха у фирменной стены: диван, столик, кресло, ковёр
rug = simple("rug", (0.32, 0.3, 0.28), rough=0.95)
rug_o = box("rug", -1.4, 1.4, -0.95, 0.95, 0.002, 0.012, rug, bevel=0.004)
rug_o.location = (-1.7, 1.45, 0)
sofa = load("sofa_02", (-1.7, 2.04, 0), rot=180)
coffee = load("modern_coffee_table_01", (-1.7, 1.2, 0), rot=90)
armchair = load("modern_arm_chair_01", (-0.4, 1.05, 0), rot=105)
side = load("side_table_01", (-0.45, 2.1, 0), rot=0)
plant_big = load("potted_plant_01", (-2.5, -2.0, 0), rot=35)
plant_mid = load("potted_plant_02", (2.6, -1.9, 0), rot=-20)
planter = load("planter_box_01", (-2.65, -0.6, 0), rot=90)

# Вывеска на синей стене: знак (две башни) неоновой трубкой и надпись шрифтом сайта
sign_m = simple("sign_neon", (0.8, 0.9, 1.0), rough=0.3, emission=(0.62, 0.84, 1.0), estrength=0)
key_value(sign_m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"], [(1, 0), (F(0.9), 0), (F(0.96), 9)])
letters_m = simple("sign_letters", (0.95, 0.97, 1.0), rough=0.35, emission=(1.0, 1.0, 1.0), estrength=0)
key_value(letters_m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"], [(1, 0), (F(0.9), 0), (F(0.96), 4)])
SX, SZ = -1.7, 1.62
sign = empty("sign", (SX, Y1 - 0.02, SZ))
cu = bpy.data.curves.new("logo", "CURVE")
cu.dimensions = "3D"
cu.bevel_depth = 0.012
cu.bevel_resolution = 3
S = 0.0145
LOGO = [
    [(2, 41), (7, 41)],
    [(41, 41), (46, 41)],
    [(7, 41), (7, 29), (15, 24.5)],
    [(41, 41), (41, 29), (33, 24.5)],
    [(15, 41), (15, 12), (23, 17), (23, 41)],
    [(25, 41), (25, 16.5), (33, 6), (33, 41)],
]
for line in LOGO:
    sp = cu.splines.new("POLY")
    sp.points.add(len(line) - 1)
    for k, (px, py) in enumerate(line):
        sp.points[k].co = ((px - 24) * S, 0, (41 - py) * S, 1)
logo = link(bpy.data.objects.new("logo", cu))
logo.data.materials.append(sign_m)
logo.location = (SX, Y1 - 0.03, SZ)
parent(logo, sign)
font = bpy.data.fonts.load(os.path.join(CACHE, "fonts", "manrope-800.ttf"))
td = bpy.data.curves.new("sign_text", "FONT")
td.body = "GulDar Group"
td.font = font
td.size = 0.24
td.extrude = 0.012
td.align_x = "CENTER"
text = link(bpy.data.objects.new("sign_text", td))
text.data.materials.append(letters_m)
text.location = (SX, Y1 - 0.03, SZ - 0.3)
text.rotation_euler = (rad(90), 0, 0)
parent(text, sign)

podium = empty("podium", (0.55, -0.85, 0))
for o in (
    box("podium_base", -0.62, 0.62, -0.32, 0.32, 0.0, 0.42, shelf_m, bevel=0.01),
    box("podium_top", -0.64, 0.64, -0.34, 0.34, 0.42, 0.46, wood, bevel=0.006),
):
    o.location += podium.location
    parent(o, podium)
goods += [
    load("spray_paint_bottles", (0.2, -0.85, 0.46), rot=25),
    load("cardboard_box_01", (0.6, -0.88, 0.46), rot=100, scale=0.5),
    load("metal_toolbox", (0.95, -0.8, 0.46), rot=-20, scale=0.75),
]
FURNITURE = [
    (podium, 0.79, 0.4),
    (counter, 0.68, 0.7),
    (slats, 0.7, 0.0),
    (rack, 0.72, 0.3),
    (chairs[0], 0.74, 0.5),
    (chairs[1], 0.755, 0.5),
    (chairs[2], 0.77, 0.5),
    (rug_o, 0.775, 0.0),
    (sofa, 0.78, 0.5),
    (coffee, 0.8, 0.4),
    (armchair, 0.81, 0.5),
    (side, 0.82, 0.4),
    (planter, 0.83, 0.4),
    (plant_big, 0.84, 0.5),
    (plant_mid, 0.85, 0.5),
    (sign, 0.86, 0.0),
]
for o, p, drop in FURNITURE:
    appear(o, p, drop)
for i, g in enumerate(goods):
    appear(g, 0.76 + i * 0.007, 0.25)

# ─── Волны: ключи фронтов ─────────────────────────────────────────────────
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
for sock, frames in (
    (walls_front, [(1, -0.3), (F(0.06), -0.3), (F(0.30), H + 0.4)]),
    (floor_front, [(1, -0.5), (F(FLOOR_P0), -0.5), (F(FLOOR_P1), FLOOR_D + 0.4)]),
):
    for f, v in frames:
        sock.default_value = v
        sock.keyframe_insert("default_value", frame=f)
bpy.context.preferences.edit.keyframe_new_interpolation_type = "BEZIER"

# ─── Камера: пролёт по сюжету ─────────────────────────────────────────────
cam_d = bpy.data.cameras.new("cam")
cam_d.lens = 42
cam = link(bpy.data.objects.new("cam", cam_d))
sc.camera = cam
aim = empty("cam_aim", (0, 0, 1))
tc = cam.constraints.new("TRACK_TO")
tc.target = aim
SHOTS = [
    # p,   азимут, возвышение, дистанция, точка интереса
    (0.00, 38, 33, 13.6, (0.1, 0.3, 0.8)),
    (0.18, 31, 28, 12.8, (0.0, 0.7, 1.0)),
    (0.40, 42, 40, 13.2, (0.1, 0.2, 0.4)),
    (0.58, 30, 26, 13.2, (0.3, 0.5, 1.0)),
    (0.78, 40, 30, 12.8, (0.0, 0.3, 0.8)),
    (1.00, 35, 31, 13.2, (0.1, 0.3, 0.8)),
]
for p, az, el, dist, tgt in SHOTS:
    f = F(p)
    t = Vector(tgt)
    cam.location = t + dist * Vector((math.cos(rad(el)) * math.sin(rad(az)), -math.cos(rad(el)) * math.cos(rad(az)), math.sin(rad(el))))
    cam.keyframe_insert("location", frame=f)
    aim.location = t
    aim.keyframe_insert("location", frame=f)

# ─── Сохранить и отрендерить ─────────────────────────────────────────────
os.makedirs(CACHE, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(CACHE, "scene.blend"))

if "--test" in ARGV:
    out = opt("--out", os.path.join(CACHE, "test"))
    os.makedirs(out, exist_ok=True)
    sc.render.resolution_percentage = int(opt("--res", 50))
    sc.cycles.samples = int(opt("--samples", 48))
    for p in [float(v) for v in opt("--at", "0,0.2,0.4,0.6,0.8,1").split(",")]:
        sc.frame_set(F(p))
        sc.render.filepath = os.path.join(out, f"p{int(p * 100):03d}.png")
        bpy.ops.render.render(write_still=True)
        print(f"[test] p={p} frame {F(p)} -> {sc.render.filepath}")
elif "--render" in ARGV:
    a, b = (int(v) for v in opt("--frames", f"1-{N}").split("-"))
    sc.frame_start, sc.frame_end = a, b
    sc.render.filepath = os.path.join(opt("--out", os.path.join(CACHE, "frames")), "f")
    bpy.ops.render.render(animation=True)
