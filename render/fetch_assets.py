"""
Скачивает бесплатные CC0-ассеты Poly Haven для фото-рендера сцены «ремонт помещения».
Лицензия CC0 — можно использовать на коммерческом сайте без указания автора.

Запуск: python render/fetch_assets.py
Кэш — вне OneDrive (сотни мегабайт не должны синхронизироваться): %USERPROFILE%/render-cache/guldar
"""

import json
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

CACHE = os.path.join(os.path.expanduser("~"), "render-cache", "guldar")
API = "https://api.polyhaven.com/files/"
UA = {"User-Agent": "guldar-site-render/1.0"}

# Модели: glTF 1K — обычные 8-битные текстуры, вся сцена помещается в 4 ГБ видеопамяти
MODELS = [
    # Черновое состояние: инструмент, свет и хлам стройки
    "ladder_sectioned_01", "metal_toolbox", "tool_cart", "cardboard_box_01", "plastic_crate_01",
    "plastic_crate_02", "wooden_crate_01", "sledgehammer_01", "cross_pein_hammer", "portable_searchlight",
    "portable_generator", "modular_electric_cables", "power_box_01", "spray_paint_bottles",
    "industrial_storage_cart", "adjustable_wrench",
    # Готовое помещение: свет, мебель, зелень
    "bar_chair_round_01", "potted_plant_01", "potted_plant_02", "potted_plant_04", "planter_box_01",
    "sofa_02", "modern_arm_chair_01", "modern_coffee_table_01", "hanging_industrial_lamp",
    "modern_ceiling_lamp_01", "painted_wooden_shelves", "drawer_cabinet", "side_table_01",
    "desk_lamp_arm_01", "metal_stool_02",
]
# Поверхности: 2K, jpg — цвет, нормали, шероховатость
TEXTURES = [
    "rough_plaster_brick_04", "concrete_floor_worn_001", "large_floor_tiles_02", "terrazzo_tiles",
    "painted_plaster_wall", "white_plaster_02", "marble_01", "concrete_wall_008", "laminate_floor_02",
    # кандидаты для чистового пола
    "smooth_concrete_floor", "large_grey_tiles", "marble_tiles", "interior_tiles", "grey_tiles",
]
TEX_MAPS = ["Diffuse", "nor_gl", "Rough", "AO"]
HDRIS = ["brown_photostudio_02", "abandoned_construction"]


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.load(r)


def download(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return 0
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=300) as r, open(path + ".part", "wb") as f:
        f.write(r.read())
    os.replace(path + ".part", path)
    return os.path.getsize(path)


def jobs():
    out = []
    for name in MODELS:
        info = get_json(API + name)["gltf"]["1k"]["gltf"]
        base = os.path.join(CACHE, "models", name)
        out.append((info["url"], os.path.join(base, os.path.basename(info["url"]))))
        for rel, inc in info.get("include", {}).items():
            out.append((inc["url"], os.path.join(base, rel)))
    for name in TEXTURES:
        info = get_json(API + name)
        for m in TEX_MAPS:
            if m in info and "2k" in info[m]:
                f = info[m]["2k"].get("jpg") or info[m]["2k"].get("png")
                out.append((f["url"], os.path.join(CACHE, "textures", name, os.path.basename(f["url"]))))
    for name in HDRIS:
        f = get_json(API + name)["hdri"]["2k"]["hdr"]
        out.append((f["url"], os.path.join(CACHE, "hdri", os.path.basename(f["url"]))))
    return out


def main():
    todo = jobs()
    print(f"файлов: {len(todo)}, папка: {CACHE}")
    total = 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        for n in ex.map(lambda j: download(*j), todo):
            total += n
    print(f"скачано: {total / 1e6:.1f} МБ")


if __name__ == "__main__":
    sys.exit(main())
