#!/usr/bin/env python3
"""Draw the deck's figures once, in black and white, into deck/assets/*.png.

The PNGs are committed and are part of the single source of truth together with
deck/deck.toml. Re-run this only when you want to redraw a figure:

    python3 tools/make_assets.py            # all
    python3 tools/make_assets.py loops      # one
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "deck" / "assets"
W, H = 2400, 1040            # matches the 11.33 x 4.91 in figure box at ~212 dpi
SS = 2                       # supersample
INK, GREY, LIGHT, PAPER = (0, 0, 0), (118, 118, 118), (205, 205, 205), (255, 255, 255)
CJK = "/usr/share/fonts/opentype/noto/NotoSansCJK-{}.ttc"
TC = 3                       # face index of Traditional Chinese in the Noto CJK collection
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"


INTER = "/usr/share/fonts/opentype/inter/Inter-{}.otf"


def font(size, weight="Regular"):
    return ImageFont.truetype(INTER.format({"Regular": "Regular", "Medium": "Medium", "Bold": "Bold",
                                            "Black": "Black"}[weight]), size * SS)


def mono(size):
    return ImageFont.truetype(MONO, size * SS)


class Fig:
    def __init__(self, w=W, h=H, bg=PAPER):
        self.w, self.h = w, h
        self.im = Image.new("RGB", (w * SS, h * SS), bg)
        self.d = ImageDraw.Draw(self.im)

    def P(self, *xy):
        return [v * SS for v in xy]

    def line(self, pts, fill=INK, width=4):
        self.d.line([(x * SS, y * SS) for x, y in pts], fill=fill, width=width * SS, joint="curve")

    def rect(self, x0, y0, x1, y1, outline=INK, width=4, fill=None, r=0):
        self.d.rounded_rectangle(self.P(x0, y0, x1, y1), radius=r * SS, outline=outline,
                                 width=width * SS, fill=fill)

    def circle(self, cx, cy, r, outline=INK, width=4, fill=None):
        self.d.ellipse(self.P(cx - r, cy - r, cx + r, cy + r), outline=outline, width=width * SS, fill=fill)

    def text(self, x, y, s, size=40, weight="Regular", fill=INK, anchor="mm", f=None):
        self.d.text((x * SS, y * SS), s, font=f or font(size, weight), fill=fill, anchor=anchor)

    def arrow(self, a, b, fill=INK, width=4, head=22, gap=0):
        (x0, y0), (x1, y1) = a, b
        ang = math.atan2(y1 - y0, x1 - x0)
        x0 += gap * math.cos(ang); y0 += gap * math.sin(ang)
        x1 -= gap * math.cos(ang); y1 -= gap * math.sin(ang)
        bx, by = x1 - head * 0.8 * math.cos(ang), y1 - head * 0.8 * math.sin(ang)
        self.line([(x0, y0), (bx, by)], fill, width)
        l = (x1 - head * math.cos(ang - 0.42), y1 - head * math.sin(ang - 0.42))
        r = (x1 - head * math.cos(ang + 0.42), y1 - head * math.sin(ang + 0.42))
        self.d.polygon([(x1 * SS, y1 * SS), (l[0] * SS, l[1] * SS), (r[0] * SS, r[1] * SS)], fill=fill)

    def arc_arrow(self, cx, cy, r, a0, a1, fill=INK, width=4, head=22):
        """Clockwise arc from angle a0 to a1 (degrees, 0 = east, 90 = south) with an arrow head at a1."""
        self.d.arc(self.P(cx - r, cy - r, cx + r, cy + r), a0, a1 - 3, fill=fill, width=width * SS)
        t = math.radians(a1)
        tip = (cx + r * math.cos(t), cy + r * math.sin(t))
        tang = t + math.pi / 2
        back = (tip[0] - head * math.cos(tang), tip[1] - head * math.sin(tang))
        self.arrow(back, tip, fill, width, head)

    def save(self, name, crop=True):
        OUT.mkdir(parents=True, exist_ok=True)
        im = self.im.resize((self.w, self.h), Image.LANCZOS)
        if crop:
            from PIL import ImageChops
            bg = Image.new("RGB", im.size, im.getpixel((0, 0)))
            x0, y0, x1, y1 = ImageChops.difference(im, bg).getbbox()
            pad = 40
            im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(self.w, x1 + pad), min(self.h, y1 + pad)))
        im.save(OUT / f"{name}.png", optimize=True)
        print("wrote", OUT / f"{name}.png")


# ---------------------------------------------------------------- figures

def phone():
    f = Fig()
    x0, y0, x1, y1 = 1000, 40, 1400, 1000
    f.rect(x0, y0, x1, y1, width=6, r=56)
    f.rect(1150, 70, 1250, 84, outline=INK, fill=INK, width=1, r=7)
    lens = [0.78, 0.92, 0.64, 0.86, 0.70]
    for i, ln in enumerate(lens):
        y = 210 + i * 160
        strong = i in (1, 3)
        f.text(1050, y, f"{i + 1}.", size=34, weight="Medium", fill=INK if strong else GREY, anchor="lm")
        x_end = 1100 + 250 * ln
        f.line([(1100, y - 14), (x_end, y - 14)], INK if strong else LIGHT, 14)
        f.line([(1100, y + 22), (1100 + 160 * ln, y + 22)], INK if strong else LIGHT, 14)
    f.save("phone")


def box():
    f = Fig()
    cx, cy, s = 1200, 640, 280
    dx, dy = s * math.cos(math.radians(30)), s * math.sin(math.radians(30))
    top = [(cx, cy - 2 * dy), (cx + dx, cy - dy), (cx, cy), (cx - dx, cy - dy)]
    bot = [(x, y + s) for x, y in top]
    f.line([top[1], top[2], top[3]], INK, 6)
    f.line([top[3], top[0], top[1]], GREY, 4)
    for a, b in zip(top[1:], bot[1:]):
        f.line([a, b], INK, 6)
    f.line([bot[1], bot[2], bot[3]], INK, 6)
    lift = 230
    lid = [(x, y - lift) for x, y in top]
    f.line(lid + [lid[0]], INK, 6)
    f.save("box")


def regression():
    f = Fig()
    rnd = random.Random(7)
    ox, oy, ex, ey = 520, 940, 1880, 80
    f.line([(ox, ey), (ox, oy), (ex, oy)], INK, 4)
    a, b = 0.62, 0.12
    pts = []
    for _ in range(38):
        x = rnd.uniform(0.04, 0.96)
        y = a * x + b + rnd.gauss(0, 0.075)
        pts.append((x, min(max(y, 0.02), 0.98)))
    n = len(pts)
    mx = sum(p[0] for p in pts) / n; my = sum(p[1] for p in pts) / n
    sl = sum((x - mx) * (y - my) for x, y in pts) / sum((x - mx) ** 2 for x, _ in pts)
    ic = my - sl * mx
    X = lambda x: ox + x * (ex - ox)
    Y = lambda y: oy - y * (oy - ey)
    lab = None
    for i, (x, y) in enumerate(pts):
        if i % 4 == 0:
            f.line([(X(x), Y(y)), (X(x), Y(sl * x + ic))], GREY, 4)
            if 0.55 < x < 0.85 and y < sl * x + ic - 0.05 and lab is None:
                lab = (X(x) + 18, (Y(y) + Y(sl * x + ic)) / 2)
    if lab:
        f.text(*lab, "error", size=46, fill=GREY, anchor="lm")
    f.line([(X(0), Y(ic)), (X(1), Y(sl + ic))], INK, 6)
    for x, y in pts:
        f.circle(X(x), Y(y), 11, outline=INK, fill=INK, width=1)
    f.text(X(1) + 24, Y(sl + ic), "y = ax + b", size=52, weight="Medium", anchor="lm")
    f.save("regression")


def nexttoken():
    f = Fig()
    f.text(140, 520, "The most likely diagnosis is", size=60, weight="Medium", anchor="lm")
    cands = [("pneumonia", 0.46), ("heart failure", 0.21), ("pulmonary embolism", 0.12), ("COPD exacerbation", 0.08), ("all others", 0.13)]
    x0, bar_max = 1640, 520
    for i, (w, p) in enumerate(cands):
        y = 230 + i * 135 + (40 if i == 4 else 0)
        strong = i == 0
        f.text(x0 - 30, y, w, size=50, weight="Medium" if strong else "Regular", fill=INK if strong else GREY, anchor="rm")
        f.line([(x0, y), (x0 + bar_max * p / 0.46, y)], INK if strong else LIGHT, 40)
        f.text(x0 + bar_max * p / 0.46 + 24, y, f"{p:.2f}", size=46, fill=INK if strong else GREY, anchor="lm")
        if i == 3:
            f.line([(x0 - 520, y + 75), (x0 + bar_max, y + 75)], LIGHT, 3)
    f.arrow((1000, 520), (1060, 520), GREY, 4, 20)
    f.save("nexttoken")


def ring(f, cx, cy, R, labels, sub=None, start=-90, node_r=None, mono_sub=False, size=52, sub_size=42):
    n = len(labels)
    angs = [start + i * 360 / n for i in range(n)]
    for i in range(n):
        a0, a1 = angs[i] + 34, angs[i] + 360 / n - 34
        f.arc_arrow(cx, cy, R, a0, a1, INK, 4, 24)
    for i, lab in enumerate(labels):
        t = math.radians(angs[i])
        x, y = cx + R * math.cos(t), cy + R * math.sin(t)
        f.circle(x, y, node_r or 150, outline=INK, fill=PAPER, width=5)
        f.text(x, y - (26 if sub else 0), lab, size=size, weight="Medium")
        if sub:
            f.text(x, y + 36, sub[i], size=sub_size, fill=GREY)


def agency():
    f = Fig()
    ring(f, 1200, 520, 360, ["Decide", "Act", "Observe"], ["LLM", "tools", "result"])
    f.save("agency")


def loops():
    f = Fig()
    ring(f, 620, 540, 330, ["Glucose", "β-cell", "Insulin"], ["rises", "senses", "lowers it"])
    ring(f, 1780, 540, 330, ["Read", "Edit", "Bash"], ["look", "act", "verify"])
    f.text(620, 540, "body", size=46, fill=GREY)
    f.text(1780, 540, "agent", size=46, fill=GREY)
    f.save("loops")


def pipeline():
    f = Fig()
    steps = [("Report in", "Read"), ("Draft summary", "Write"), ("Check format", "Bash"), ("Compare prior", "Read"), ("Save version", "Write")]
    bw, bh, gap, y = 380, 190, 70, 470
    x = (W - (len(steps) * bw + (len(steps) - 1) * gap)) / 2
    xs = []
    for i, (lab, verb) in enumerate(steps):
        f.rect(x, y - bh / 2, x + bw, y + bh / 2, width=5, r=10)
        f.text(x + bw / 2, y, lab, size=46, weight="Medium")
        f.text(x + bw / 2, y + bh / 2 + 58, verb, size=46, fill=GREY)
        xs.append(x)
        if i:
            f.arrow((x - gap, y), (x, y), INK, 4, 20, gap=6)
        x += bw + gap
    # loop back from 檢查 to 草擬
    a, b = xs[2] + bw / 2, xs[1] + bw / 2
    top = y - bh / 2
    f.line([(a, top), (a, top - 120), (b, top - 120)], INK, 4)
    f.arrow((b, top - 120), (b, top - 4), INK, 4, 22)
    f.text((a + b) / 2, top - 165, "fails → redo", size=46, fill=GREY)
    # state note under 對照前次
    f.text(xs[3] + bw / 2, y + bh / 2 + 120, "prior RECIST", size=46, fill=GREY)
    f.save("pipeline")


def hitl():
    f = Fig()
    ring(f, 1200, 540, 380, ["Data", "Model", "Advice", "Decision"], size=48)
    for ang in (-45, 45, 135, 225):
        t = math.radians(ang)
        x, y = 1200 + 380 * math.cos(t), 540 + 380 * math.sin(t)
        f.circle(x, y, 40, outline=INK, fill=INK, width=1)
        f.text(x, y - 2, "?", size=50, weight="Bold", fill=PAPER)
    f.save("hitl")


def label():
    f = Fig()
    x0, x1, y = 200, 2200, 40
    f.rect(x0, y, x1, 1000, width=5)
    f.text(x0 + 50, y + 70, "Codeximab®  Claudixumab®  Geminimumab®", size=56, weight="Bold", anchor="lm")
    f.text(x0 + 50, y + 135, "stochastic next-token predictor", size=44, fill=GREY, anchor="lm")
    f.line([(x0, y + 185), (x1, y + 185)], INK, 3)
    rows = [("Indications", "First drafts: summaries, letters, literature search"),
            ("Dosage", "Smallest effective model for the task"),
            ("Adverse effects", "Hallucination, overconfidence, sycophancy"),
            ("Interactions", "With untrusted content: prompt injection")]
    for i, (k, v) in enumerate(rows):
        yy = y + 260 + i * 105
        f.text(x0 + 50, yy, k, size=46, weight="Bold", anchor="lm")
        f.text(x0 + 500, yy, v, size=46, anchor="lm")
    by = y + 690
    f.rect(x0 + 40, by, x1 - 40, by + 230, width=12)
    f.text(x0 + 90, by + 70, "BOXED WARNING", size=40, weight="Black", anchor="lm")
    f.text(x0 + 90, by + 150, "Not for unsupervised clinical decisions. A physician signs.", size=38, weight="Medium", anchor="lm")
    f.save("label")


def tree():
    f = Fig()
    root = (1200, 120)
    f.rect(960, 60, 1440, 180, width=5, r=8)
    f.text(*root, "Abdominal pain", size=48, weight="Bold")
    kids = [("RUQ", "biliary"), ("Epigastric", "pancreas · MI"), ("RLQ", "appendix"), ("LLQ", "diverticulitis"), ("Diffuse", "ischemia · DKA")]
    n = len(kids)
    xs = [240 + i * (1920 / (n - 1)) for i in range(n)]
    f.line([(1200, 180), (1200, 300)], INK, 4)
    f.line([(xs[0], 300), (xs[-1], 300)], INK, 4)
    for x, (k, ex) in zip(xs, kids):
        f.line([(x, 300), (x, 400)], INK, 4)
        f.rect(x - 185, 400, x + 185, 520, width=5, r=8)
        f.text(x, 460, k, size=46, weight="Medium")
        f.text(x, 600, ex, size=46, fill=GREY)
    f.save("tree")


def searchlight():
    f = Fig()
    # left: bucket

    bx0, bx1, btop, bbot = 380, 740, 420, 900
    f.line([(bx0, btop), (bx0 + 40, bbot), (bx1 - 40, bbot), (bx1, btop)], INK, 6)
    rnd = random.Random(3)
    for i in range(14):
        x = rnd.uniform(bx0 + 60, bx1 - 60)
        y = rnd.uniform(140, 380) if i < 6 else rnd.uniform(btop + 280, bbot - 30)
        f.circle(x, y, 10, outline=INK, fill=INK, width=1)
    f.text(560, 980, "Bucket: pour observations in", size=46, fill=INK)
    # right: dark field with a beam
    X0 = 1080
    f.d.rectangle(f.P(X0, 0, W, H), fill=INK)
    lamp = (1180, 820)
    beam = [lamp, (2220, 120), (2360, 520)]
    f.d.polygon([(x * SS, y * SS) for x, y in beam], fill=PAPER)
    rnd = random.Random(11)
    for _ in range(26):
        x, y = rnd.uniform(X0 + 60, W - 40), rnd.uniform(40, H - 40)
        inside = _in_tri((x, y), *beam)
        f.circle(x, y, 10, outline=INK if inside else (40, 40, 40), fill=INK if inside else (40, 40, 40), width=1)
    f.circle(*lamp, 26, outline=PAPER, fill=PAPER, width=1)
    f.text(1720, 980, "Searchlight: a question decides what you see", size=46, fill=PAPER)
    f.save("searchlight", crop=False)


def _in_tri(p, a, b, c):
    def s(p1, p2, p3):
        return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])
    d1, d2, d3 = s(p, a, b), s(p, b, c), s(p, c, a)
    return not ((d1 < 0 or d2 < 0 or d3 < 0) and (d1 > 0 or d2 > 0 or d3 > 0))


FIGS = {k: v for k, v in globals().items() if callable(v) and v.__module__ == __name__
        and k in "phone box regression nexttoken agency loops pipeline hitl label tree searchlight".split()}

if __name__ == "__main__":
    for name in sys.argv[1:] or FIGS:
        FIGS[name]()
