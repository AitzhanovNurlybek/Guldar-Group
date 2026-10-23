from pathlib import Path
from PIL import Image, ImageChops, ImageOps

source_dir = Path(__file__).resolve().parents[1] / "public/clients"
output = source_dir / "optimized"
output.mkdir(exist_ok=True)
sources = {
    "sulpak": "sulpak.webp", "kcell": "kcell.webp", "alser": "alser.jpeg",
    "mechta": "mechta.png", "beeline": "beeline.jpg", "bank-rbk": "bank rbk.png",
    "qazaq-oil": "qazaq oil.jpg", "atamiras": "atamiras.jpg", "evrika": "evrika.webp", "jusan": "jusan.webp",
}
for slug, filename in sources.items():
    source = Image.open(source_dir / filename).convert("RGBA")
    image = Image.new("RGBA", source.size, "white")
    image.alpha_composite(source)
    image = image.convert("RGB")
    difference = ImageChops.difference(image, Image.new("RGB", image.size, "white"))
    mask = difference.convert("L").point(lambda value: 255 if value > 30 else 0)
    bounds = mask.getbbox()
    if bounds:
        image = image.crop(bounds)
    image = ImageOps.expand(image, border=4, fill="white")
    image.thumbnail((600, 300))
    image.save(output / f"{slug}.webp", quality=94)
    print(slug, image.size)
