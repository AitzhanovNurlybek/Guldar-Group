"""Build the Cyrillic and Latin subsets used above the fold. Requires fonttools and brotli."""
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, os.path.join(tempfile.gettempdir(), 'guldar-font-brotli'))
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

folder = Path(__file__).resolve().parent.parent / 'public' / 'fonts'
for name, points, weights in [
    ('manrope-cyrillic', list(range(0x400, 0x530)), (400, 800)),
    ('manrope-latin', list(range(0x20, 0x7f)) + [0xa0, 0xab, 0xbb, 0x20b8, 0x2013, 0x2014, 0x2026, 0x2192, 0x2197, 0x2212], (400, 800)),
    ('montserrat-cyrillic', list(range(0x400, 0x530)), (600, 800)),
]:
    font = TTFont(folder / (name + '.woff2'))
    if 'fvar' in font:
        instantiateVariableFont(font, {'wght': weights}, inplace=True)
    if 'gvar' in font:
        variations = font['gvar'].variations
        font['gvar'].variations = {glyph: variations[glyph] if glyph in variations else [] for glyph in font.getGlyphOrder()}
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['kern', 'liga', 'clig', 'locl', 'mark', 'mkmk']
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=points)
    sub.subset(font)
    font.flavor = 'woff2'
    target = folder / (name + '-optimized.woff2')
    font.save(target)
    print(name, (folder / (name + '.woff2')).stat().st_size, '->', target.stat().st_size)
