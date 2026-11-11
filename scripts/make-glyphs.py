"""Extrai os contornos das letras usadas nos badges (Inter SemiBold, licença OFL).

Gera scripts/font-glyphs.json, que o build-badges.mjs usa para medir e desenhar o texto
de verdade, em vez de depender da fonte de quem abre o perfil.

Uso: python3 scripts/make-glyphs.py [caminho/para/Inter-SemiBold.otf]
"""
import json
import string
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

font_path = sys.argv[1] if len(sys.argv) > 1 else "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
out = Path(__file__).with_name("font-glyphs.json")

font = TTFont(font_path)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]

charset = string.ascii_letters + string.digits + " .+-_/#"
chars = {}
for ch in charset:
    name = cmap[ord(ch)]
    pen = SVGPathPen(glyphs)
    glyphs[name].draw(pen)
    bounds = BoundsPen(glyphs)
    glyphs[name].draw(bounds)
    adv = hmtx[name][0]
    # xMin/xMax: onde o desenho da letra realmente começa e termina (o espaço fica sem contorno)
    x_min, _, x_max, _ = bounds.bounds if bounds.bounds else (0, 0, adv, 0)
    chars[ch] = {"adv": adv, "xMin": x_min, "xMax": x_max, "d": pen.getCommands()}

data = {
    "upm": font["head"].unitsPerEm,
    "capHeight": font["OS/2"].sCapHeight,
    "chars": chars,
}
out.write_text(json.dumps(data, separators=(",", ":")))
print(f"{len(chars)} caracteres, upm {data['upm']}, capHeight {data['capHeight']} -> {out}")
