from __future__ import annotations

from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader

DOC = Path("out/pct_brief_report.pdf")
FIGDIR = Path("out/figures")
MD = Path("docs/pct_draft.md")


def add_heading(c: canvas.Canvas, text: str, y: float) -> float:
    c.setFont("Helvetica-Bold", 16)
    c.drawString(20 * mm, y, text)
    return y - 8 * mm


def add_paragraph(c: canvas.Canvas, text: str, y: float, size: int = 10) -> float:
    c.setFont("Helvetica", size)
    width = 170 * mm
    lines = []
    # naive wrap
    for para in text.split("\n"):
        words = para.split()
        line = ""
        for w in words:
            test = (line + " " + w).strip()
            if c.stringWidth(test, "Helvetica", size) < width:
                line = test
            else:
                if line:
                    lines.append(line)
                line = w
        if line:
            lines.append(line)
        lines.append("")
    for ln in lines:
        c.drawString(20 * mm, y, ln)
        y -= 5 * mm
    return y


def main() -> None:
    DOC.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(DOC), pagesize=A4)
    w, h = A4

    # Title
    y = h - 20 * mm
    y = add_heading(c, "SCPG – Safety Compensated Power Generator", y)

    # Abstract from md (first paragraph under Abstract)
    md_text = MD.read_text(encoding="utf-8")
    abstract = ""
    capture = False
    for line in md_text.splitlines():
        if line.strip().lower().startswith("## abstract"):
            capture = True
            continue
        if capture:
            if line.startswith("## "):
                break
            abstract += line + "\n"
    if abstract.strip():
        y = add_heading(c, "Abstract", y - 5 * mm)
        y = add_paragraph(c, abstract.strip(), y)

    # Figures page
    c.showPage()
    y = h - 20 * mm
    y = add_heading(c, "Figures", y)
    figures = [
        ("FIG1_system_overview.png", "FIG.1 — System Overview"),
        ("FIG2_control_diagram.png", "FIG.2 — Control Diagram"),
        ("FIG3_interlock_matrix.png", "FIG.3 — Interlock Matrix"),
        ("FIG4_waveforms.png", "FIG.4 — Waveforms"),
        ("FIG5_impedance_estimation.png", "FIG.5 — RLS Estimation"),
        ("FIG6_touch_current_model.png", "FIG.6 — Touch Current Model"),
    ]
    for fname, caption in figures:
        img_path = FIGDIR / fname
        if not img_path.exists():
            continue
        y -= 5 * mm
        c.setFont("Helvetica-Bold", 10)
        c.drawString(20 * mm, y, caption)
        y -= 60 * mm
        c.drawImage(ImageReader(str(img_path)), 20 * mm, y, width=170 * mm, height=50 * mm, preserveAspectRatio=True, anchor='n')
        y -= 10 * mm
        if y < 60 * mm:
            c.showPage()
            y = h - 20 * mm

    # Claims (from md section)
    c.showPage()
    y = h - 20 * mm
    y = add_heading(c, "Claims (bozza)", y)
    claims = ""
    capture = False
    for line in md_text.splitlines():
        if line.strip().lower().startswith("## rivendicazioni"):
            capture = True
            continue
        if capture:
            if line.startswith("## "):
                break
            claims += line + "\n"
    y = add_paragraph(c, claims.strip(), y)

    c.save()
    print(f"Wrote {DOC}")


if __name__ == "__main__":
    main()
