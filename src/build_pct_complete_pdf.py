from __future__ import annotations

from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader

MD = Path("docs/pct_complete.md")
OUT = Path("out/pct_complete.pdf")
FIGS = {
    "[[FIG1]]": ("out/figures/FIG1_system_overview.png", "FIG. 1 — System Overview"),
    "[[FIG2]]": ("out/figures/FIG2_control_diagram.png", "FIG. 2 — Control Diagram"),
    "[[FIG3]]": ("out/figures/FIG3_interlock_matrix.png", "FIG. 3 — Interlock Matrix"),
    "[[FIG4]]": ("out/figures/FIG4_waveforms.png", "FIG. 4 — Waveforms"),
    "[[FIG5]]": ("out/figures/FIG5_impedance_estimation.png", "FIG. 5 — RLS Estimation"),
    "[[FIG6]]": ("out/figures/FIG6_touch_current_model.png", "FIG. 6 — Touch Current Model"),
}


def draw_wrapped(c: canvas.Canvas, text: str, y: float, size: int = 10) -> float:
    c.setFont("Helvetica", size)
    width = 170 * mm
    words = text.split()
    line = ""
    while words:
        w = words.pop(0)
        test = (line + " " + w).strip()
        if c.stringWidth(test, "Helvetica", size) < width:
            line = test
        else:
            c.drawString(20 * mm, y, line)
            y -= 5 * mm
            line = w
    if line:
        c.drawString(20 * mm, y, line)
        y -= 7 * mm
    return y


def main() -> None:
    text = MD.read_text(encoding="utf-8").splitlines()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=A4)
    w, h = A4

    y = h - 20 * mm
    c.setFont("Helvetica-Bold", 16)
    c.drawString(20 * mm, y, "SCPG – Safety Compensated Power Generator (PCT completo)")
    y -= 10 * mm

    for line in text:
        ls = line.strip()
        if ls in FIGS:
            if y < 100 * mm:
                c.showPage(); y = h - 20 * mm
            img_path, caption = FIGS[ls]
            c.setFont("Helvetica-Bold", 10)
            c.drawString(20 * mm, y, caption)
            y -= 60 * mm
            c.drawImage(ImageReader(img_path), 20 * mm, y, width=170 * mm, height=50 * mm, preserveAspectRatio=True, anchor='n')
            y -= 10 * mm
            continue
        if ls.startswith("# "):
            c.setFont("Helvetica-Bold", 14)
            c.drawString(20 * mm, y, ls[2:])
            y -= 8 * mm
        elif ls.startswith("## "):
            c.setFont("Helvetica-Bold", 12)
            c.drawString(20 * mm, y, ls[3:])
            y -= 8 * mm
        elif ls == "":
            y -= 4 * mm
        else:
            if y < 30 * mm:
                c.showPage(); y = h - 20 * mm
            y = draw_wrapped(c, ls, y, 10)
        if y < 20 * mm:
            c.showPage(); y = h - 20 * mm

    c.save()
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
