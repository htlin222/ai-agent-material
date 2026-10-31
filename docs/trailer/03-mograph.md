# Trailer · 3 · Mograph

The picture, score and voice are all computed; no footage, images or audio samples are used.

```bash
# from the repo root; needs Node 20+, Playwright's Chromium, ffmpeg, Python with numpy, scipy, soundfile
# voice: espeak-ng binary, or `pip install espeakng-loader` (trailer/tts.py uses the bundled library)
node trailer/render.mjs plan                 # → trailer/build/plan.json
node trailer/render.mjs stills 96,450,1170   # preview frames → trailer/build/sheet.png
node trailer/render.mjs music                # → trailer/build/music.wav   (Web Audio, OfflineAudioContext)
python3 trailer/vo.py                        # → trailer/build/vo.wav      (vocoded voice)
node trailer/render.mjs video 0-1584 3       # frames → trailer/build/part_*.mp4
bash trailer/mix.sh                          # → trailer/build/AI-Agents_Trailer_16x9.mp4  (−14 LUFS)
```

Open `trailer/page.html` in a browser to watch it play live (no sound).

| File | Role |
| --- | --- |
| `trailer/plan.js` | Edit decision list in beats: shots, voice lines, vocal chops. Change timing here only. |
| `trailer/trailer.js` | `T.render(ctx, i)`: every shot kind is a pure function of local beat time. |
| `trailer/music.js` | Score (adapted from `htlin222/mograph-library`). |
| `trailer/vo.py`, `trailer/tts.py` | Voice: espeak-ng → channel vocoder on the score's chords. |
| `trailer/mix.sh` | Side-chain duck, loudness to −14 LUFS, mux. |

Checks used while making it: contact sheets of stills at every shot kind, a 2-second contact sheet of the final
MP4, and an EBU R128 measurement (I −14.0 LUFS).
