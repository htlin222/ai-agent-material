# AI Agents in Clinical Medicine: What Does Not Expire

Lecture material for Taipei Medical University (2026), by Hsieh-Ting Lin, MD.

**Downloads:** the slides (PPTX and PDF) and the 16:9 trailer (MP4) are in [Releases](../../releases).

## What is here

| Path | What it is |
| --- | --- |
| `docs/outline.md` | Talk design: seven acts, 47 slides, speaker beats, the ten prescriptions |
| `deck/deck.toml` | **Source of truth** for every slide: text, layout, speaker notes, APA references |
| `deck/assets/*.png` | **Source of truth** for the figures (black and white) |
| `tools/build_deck.py` | TOML + PNG → `build/deck.pptx`, `build/deck.pdf`, slide PNGs, contact sheet; fails on any text overflow or missing reference |
| `tools/make_assets.py` | Redraws the figures (only when a figure should change) |
| `docs/references.md` | All references in APA 7 |
| `docs/trailer/` | Trailer in three stages: idea → design → mograph |
| `trailer/` | Trailer source: shot plan, frame renderer, synthesized score and voice |

## Build the slides

```bash
pip install python-pptx pillow lxml
python3 tools/build_deck.py        # needs LibreOffice for the PDF; fonts: Inter, Noto Sans CJK TC, DejaVu Sans Mono
```

Edit `deck/deck.toml`, rebuild, and look at `build/sheet.png`. Slide text is English; speaker notes are in
Traditional Chinese. Install the Inter font before presenting the PPTX, or PowerPoint will substitute it.

## Design rules

Black, white and grey only. One idea per slide. No decoration that does not carry meaning. Every slide has an APA
reference in its footer. Figures use labels large enough to read from the back of a lecture hall.

## Credits

Trailer score, render and mix pipeline adapted from [htlin222/mograph-library](https://github.com/htlin222/mograph-library).
Fonts: Inter, Noto Sans CJK (SIL OFL), DejaVu Sans Mono.
