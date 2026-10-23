from pathlib import Path
import shutil
import pymupdf
from PIL import Image

root = Path(__file__).resolve().parents[1]
output = root / "public" / "reviews"
output.mkdir(parents=True, exist_ok=True)
sources = {
    "dana": "Отзыв ЧШ Дана.pdf",
    "sulpak": "Отзыв Сулпак Шемонайха.pdf",
    "mastershina": "Мастершина.pdf",
}
for slug, name in sources.items():
    source = Path.home() / "Downloads" / name
    shutil.copy2(source, output / f"{slug}.pdf")
    with pymupdf.open(source) as document:
        pixmap = document[0].get_pixmap(matrix=pymupdf.Matrix(0.8, 0.8), alpha=False)
        Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples).save(output / f"{slug}.webp", quality=82)
    print(slug, "ready")
