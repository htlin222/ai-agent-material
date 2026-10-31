#!/usr/bin/env python3
"""deck/deck.toml + deck/assets/*.png  →  build/deck.pptx, build/deck.pdf, build/png/NN.png, build/sheet.png

    python3 tools/build_deck.py            # build everything and run the layout check
    python3 tools/build_deck.py --no-pdf   # pptx + layout check only

The layout check measures every text box with the real fonts and fails the build
if anything would overflow or the footer would collide with content.
"""
import re
import subprocess
import sys
import tomllib
from pathlib import Path

from lxml import etree
from PIL import Image, ImageFont
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

ROOT = Path(__file__).resolve().parent.parent
DECK = ROOT / "deck"
BUILD = ROOT / "build"
SW, SH = 13.333, 7.5
ML = 0.85                       # side margin
CW = SW - 2 * ML                # content width
FOOT_Y = 6.62                   # footer top
CONTENT_BOTTOM = 6.42           # nothing but the footer below this line

MEASURE = {
    ("sans", False): ("/usr/share/fonts/opentype/inter/Inter-Regular.otf", 0),
    ("sans", True): ("/usr/share/fonts/opentype/inter/Inter-Bold.otf", 0),
    ("mono", False): ("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 0),
    ("mono", True): ("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 0),
}
problems = []


# ───────────────────────────────────────────── text helpers

def rgb(hexstr):
    return RGBColor.from_string(hexstr)


def set_font(run, theme, size, bold=False, color=None, mono=False, italic=False):
    f = run.font
    f.size = Pt(size)
    f.bold = bold
    f.italic = italic
    f.color.rgb = rgb(color or theme["ink"])
    latin = theme["mono"] if mono else theme["sans_latin"]
    f.name = latin
    rpr = run._r.get_or_add_rPr()
    for tag, face in (("a:ea", theme["sans_cjk"]), ("a:cs", theme["sans_cjk"])):
        el = rpr.find(qn(tag))
        if el is None:
            el = etree.SubElement(rpr, qn(tag))
        el.set("typeface", face)


def measure_lines(text, size_pt, width_in, bold=False, mono=False):
    """Greedy wrap with the real font; returns number of lines."""
    path, idx = MEASURE[("mono" if mono else "sans", bold)]
    font = ImageFont.truetype(path, int(size_pt * 10), index=idx)   # 10 px per pt → width in pt*10
    limit = width_in * 72 * 10
    lines = 0
    for para in text.split("\n"):
        if not para:
            lines += 1
            continue
        tokens = re.findall(r"[A-Za-z0-9\-\.,;:'’()/&%®@\[\]<>+=_#*]+ ?|\s|.", para)
        cur = ""
        n = 1
        for tok in tokens:
            trial = cur + tok
            if font.getlength(trial) > limit and cur.strip():
                n += 1
                cur = tok.lstrip()
            else:
                cur = trial
        lines += n
    return lines


def textbox(slide, x, y, w, h, paras, theme, anchor="top", align="left", check=None):
    """paras: list of dict(text, size, bold, color, mono, space_before, line)"""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    for side in ("left", "right", "top", "bottom"):
        setattr(tf, f"margin_{side}", 0)
    tf.vertical_anchor = {"top": MSO_ANCHOR.TOP, "middle": MSO_ANCHOR.MIDDLE, "bottom": MSO_ANCHOR.BOTTOM}[anchor]
    need = 0.0
    for i, p in enumerate(paras):
        para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        para.alignment = {"left": PP_ALIGN.LEFT, "center": PP_ALIGN.CENTER, "right": PP_ALIGN.RIGHT}[align]
        ls = p.get("line", 1.2)
        para.line_spacing = ls
        if p.get("space_before"):
            para.space_before = Pt(p["space_before"])
        for seg, ital in split_italics(p["text"]) if p.get("rich") else [(p["text"], False)]:
            r = para.add_run()
            r.text = seg
            set_font(r, theme, p["size"], p.get("bold", False), p.get("color"), p.get("mono", False), ital)
        n = measure_lines(p["text"].replace("*", ""), p["size"], w, p.get("bold", False), p.get("mono", False))
        need += n * p["size"] * ls / 72 * 1.17 + p.get("space_before", 0) / 72
    if check and need > h + 0.02:
        problems.append(f"{check}: text needs {need:.2f} in but box is {h:.2f} in")
    return tb, need


def split_italics(s):
    out = []
    for i, part in enumerate(s.split("*")):
        if part:
            out.append((part, i % 2 == 1))
    return out


def notes(slide, text):
    if text:
        slide.notes_slide.notes_text_frame.text = text


# ───────────────────────────────────────────── layouts

def L_title(s, d, T, meta, tag):
    textbox(s, ML, 2.2, CW, 1.2, [dict(text=d["title"], size=52, bold=True)], T, check=tag)
    textbox(s, ML, 3.35, CW, 0.9, [dict(text=d["subtitle"], size=34)], T, check=tag)
    by = f'{meta["author"]}\n{meta["affiliation"]}\n{meta["venue"]} · {meta["year"]}'
    textbox(s, ML, 4.75, CW, 1.4, [dict(text=by, size=18, color=T["grey"], line=1.35)], T, check=tag)


def L_statement(s, d, T, meta, tag):
    if d.get("kicker"):
        textbox(s, ML, 0.75, CW, 0.5, [dict(text=d["kicker"], size=20, color=T["grey"])], T, check=tag)
    paras = [dict(text=d["text"], size=d.get("size", 40), bold=True, color=T["grey"] if d.get("text_grey") else None, line=1.25)]
    if d.get("sub"):
        paras.append(dict(text=d["sub"], size=24, color=T["grey"], space_before=22, line=1.35))
    textbox(s, ML, 1.5, CW * 0.92, 4.6, paras, T, anchor="middle", check=tag)


def L_keyword(s, d, T, meta, tag):
    paras = [dict(text=d["word"], size=112, bold=True, line=1.0)]
    if d.get("gloss"):
        paras.append(dict(text=d["gloss"], size=28, color=T["grey"], space_before=26))
    textbox(s, ML, 1.2, CW, 4.9, paras, T, anchor="middle", check=tag)


def L_figure(s, d, T, meta, tag):
    top = 0.65
    if d.get("title"):
        textbox(s, ML, 0.6, CW, 0.7, [dict(text=d["title"], size=30, bold=True)], T, check=tag)
        top = 1.35
    CAP_Y = 5.5                                  # one caption baseline for every figure slide
    box_bottom = CAP_Y - 0.2 if d.get("caption") else CONTENT_BOTTOM
    box_h = box_bottom - top
    img = Image.open(DECK / "assets" / d["image"])
    ar = img.width / img.height
    w = min(CW, box_h * ar)
    h = w / ar
    y = top + (box_h - h) / 2
    s.shapes.add_picture(str(DECK / "assets" / d["image"]), Inches((SW - w) / 2), Inches(y), Inches(w), Inches(h))
    if d.get("caption"):
        textbox(s, ML, CAP_Y, CW, CONTENT_BOTTOM - CAP_Y, [dict(text=d["caption"], size=22, color=T["grey"])],
                T, align="center", check=tag)


def L_rule(s, d, T, meta, tag):
    textbox(s, ML, 0.75, CW, 0.5, [dict(text='Rx', size=20, color=T["grey"])], T, check=tag)
    paras = [dict(text=d["text"], size=40, bold=True, line=1.25)]
    if d.get("sub"):
        paras.append(dict(text=d["sub"], size=24, color=T["grey"], space_before=22, line=1.35))
    textbox(s, ML, 1.5, CW * 0.92, 4.6, paras, T, anchor="middle", check=tag)


def L_code(s, d, T, meta, tag):
    code = d["code"].strip("\n")
    textbox(s, ML, 1.0, CW, 4.2, [dict(text=code, size=24, mono=True, line=1.45)],
            T, anchor="middle", check=tag)
    if d.get("caption"):
        textbox(s, ML, 5.5, CW, CONTENT_BOTTOM - 5.5, [dict(text=d["caption"], size=22, color=T["grey"])], T, align="center", check=tag)


def L_columns(s, d, T, meta, tag):
    textbox(s, ML, 0.75, CW, 0.8, [dict(text=d["title"], size=32, bold=True)], T, check=tag)
    n = len(d["cols"])
    gap = 0.6
    cw = (CW - gap * (n - 1)) / n
    for i, c in enumerate(d["cols"]):
        x = ML + i * (cw + gap)
        textbox(s, x, 2.3, cw, 3.6, [dict(text=c["head"], size=36, bold=True),
                                     dict(text=c["body"], size=22, color=T["grey"], space_before=18, line=1.45)],
                T, check=tag)


def L_stat(s, d, T, meta, tag):
    paras = [dict(text=d["big"], size=140, bold=True, line=1.0),
             dict(text=d["text"], size=28, space_before=18, line=1.35)]
    if d.get("sub"):
        paras.append(dict(text=d["sub"], size=20, color=T["grey"], space_before=14))
    textbox(s, ML, 0.9, CW, 5.3, paras, T, anchor="middle", check=tag)


def L_list(s, d, T, meta, tag):
    textbox(s, ML, 0.7, CW, 0.7, [dict(text=d["title"], size=30, bold=True)], T, check=tag)
    half = (len(d["items"]) + 1) // 2
    gap = 0.5
    cw = (CW - gap) / 2
    for col in range(2):
        items = d["items"][col * half:(col + 1) * half]
        paras = [dict(text=f"{col * half + i + 1}.\t{t}", size=18, line=1.25, space_before=0 if i == 0 else 10)
                 for i, t in enumerate(items)]
        tb, _ = textbox(s, ML + col * (cw + gap), 1.75, cw, 4.5, paras, T, check=tag)
        for para in tb.text_frame.paragraphs:          # hanging indent: wrapped lines align with the text
            pPr = para._p.get_or_add_pPr()
            pPr.set("marL", str(Inches(0.42)))
            pPr.set("indent", str(-Inches(0.42)))


def L_quote(s, d, T, meta, tag):
    paras = [dict(text=d["text"], size=40, line=1.3),
             dict(text=f'— {d["by"]}', size=22, color=T["grey"], space_before=28)]
    textbox(s, ML, 1.2, CW, 4.9, paras, T, anchor="middle", check=tag)


def L_blank(s, d, T, meta, tag):
    textbox(s, ML, 3.2, CW, 0.8, [dict(text=d["text"], size=24, color=T["grey"])], T, align="center", check=tag)


LAYOUTS = {k[2:]: v for k, v in globals().items() if k.startswith("L_")}


def footer(s, refs, T, idx, total, tag):
    paras = [dict(text=r, size=9, color=T["grey"], rich=True, line=1.15, space_before=0 if i == 0 else 2)
             for i, r in enumerate(refs)]
    _, need = textbox(s, ML, FOOT_Y, CW - 1.0, SH - FOOT_Y - 0.22, paras, T, anchor="bottom", check=f"{tag} footer")
    textbox(s, SW - ML - 0.9, FOOT_Y, 0.9, SH - FOOT_Y - 0.22,
            [dict(text=f"{idx} / {total}", size=9, color=T["grey"], line=1.15)], T, anchor="bottom", align="right")


# ───────────────────────────────────────────── build

def build(pdf=True):
    cfg = tomllib.loads((DECK / "deck.toml").read_text())
    T, meta, refs = cfg["theme"], cfg["meta"], cfg["refs"]
    prs = Presentation()
    prs.slide_width, prs.slide_height = Inches(SW), Inches(SH)
    blank = prs.slide_layouts[6]
    slides = cfg["slide"]
    for i, d in enumerate(slides, 1):
        tag = f"p{i:02d} ({d['layout']})"
        s = prs.slides.add_slide(blank)
        bg = s.background.fill
        bg.solid()
        bg.fore_color.rgb = rgb(T["paper"])
        LAYOUTS[d["layout"]](s, d, T, meta, tag)
        missing = [r for r in d.get("refs", []) if r not in refs]
        if not d.get("refs") or missing:
            problems.append(f"{tag}: missing references {missing or '(none listed)'}")
        footer(s, [refs[r] for r in d.get("refs", []) if r in refs], T, i, len(slides), tag)
        notes(s, d.get("notes", ""))
    prs.core_properties.title = meta["title"]
    prs.core_properties.author = meta["author"]
    BUILD.mkdir(exist_ok=True)
    out = BUILD / "deck.pptx"
    prs.save(out)
    print("wrote", out)
    if pdf:
        subprocess.run(["soffice", "--headless", "--convert-to",
                        'pdf:impress_pdf_Export:{"UseLosslessCompression":{"type":"boolean","value":"true"},'
                        '"ReduceImageResolution":{"type":"boolean","value":"false"}}', "--outdir", str(BUILD), str(out)],
                       check=True, capture_output=True, timeout=300)
        print("wrote", BUILD / "deck.pdf")
        png = BUILD / "png"
        png.mkdir(exist_ok=True)
        for old in png.glob("*.png"):
            old.unlink()
        subprocess.run(["pdftoppm", "-r", "96", "-png", str(BUILD / "deck.pdf"), str(png / "p")], check=True)
        sheet(sorted(png.glob("p-*.png")))
    if problems:
        print("\nLAYOUT CHECK FAILED")
        for p in problems:
            print("  -", p)
        sys.exit(1)
    print("layout check: ok")


def sheet(files, cols=4):
    ims = [Image.open(f).convert("RGB") for f in files]
    w, h = 480, 270
    rows = (len(ims) + cols - 1) // cols
    S = Image.new("RGB", (cols * (w + 8) + 8, rows * (h + 8) + 8), (150, 150, 150))
    for i, im in enumerate(ims):
        S.paste(im.resize((w, h), Image.LANCZOS), (8 + (i % cols) * (w + 8), 8 + (i // cols) * (h + 8)))
    S.save(BUILD / "sheet.png")
    print("wrote", BUILD / "sheet.png")


if __name__ == "__main__":
    build(pdf="--no-pdf" not in sys.argv)
