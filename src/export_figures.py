from __future__ import annotations

import os
from pathlib import Path
import cairosvg

SRC = Path("docs/figures")
OUT = Path("out/figures")
OUT.mkdir(parents=True, exist_ok=True)

for svg in sorted(SRC.glob("*.svg")):
    base = svg.stem
    png_path = OUT / f"{base}.png"
    pdf_path = OUT / f"{base}.pdf"
    cairosvg.svg2png(url=str(svg), write_to=str(png_path), output_width=1600, output_height=1067)
    cairosvg.svg2pdf(url=str(svg), write_to=str(pdf_path))
    print(f"Exported {svg.name} -> {png_path.name}, {pdf_path.name}")
