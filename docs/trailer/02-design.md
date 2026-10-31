# Trailer · 2 · Design

Generated from `trailer/plan.js` (the single source for picture, score and voice). 16:9, 1920×1080, 30 fps,
150 BPM (beat 0.4 s), 132 beats = 52.8 s.

## Visual system

- **Ground and ink:** pure black ground, white ink (rgb 242), greys only through alpha. No hue, no gradient, no glow.
- **Type:** Inter 500–900 for words; DejaVu Sans Mono 400 for labels, counters and code. Labels are upper-case mono with
  tracking; headlines are set tight and large.
- **Chrome (from mograph-library):** corner marks, a mono title strip bottom-left, a `bar.beat` counter bottom-right.
- **Motion:** every cut lands on a beat. Inside the drops the whole frame punch-zooms 3 % on each beat. Accents: white
  flash on section downbeats, a three-hit horizontal-slice glitch in the break, wipes for keywords, typewriter for lines.
- **Diagrams are live:** the regression line fits itself, the token bars resample on the next beat, the loop's active
  node steps every half beat, a packet travels the pipeline and loops back once at "Check".

## Sections

| Section | Beats | What happens |
| --- | --- | --- |
| intro | 0–16 | Every tool expires: the product list is struck through; a box opens |
| build | 16–32 | B · R · E · W, then the verbs alone, then an agent log types itself; a one-beat silence: LOOP |
| drop 1 | 32–64 | Thirteen keywords with live diagrams between them |
| break | 64–72 | The phone: five questions, two light up |
| drop 2 | 72–104 | Ten prescriptions, the keyword mosaic, 78.6 % |
| rise | 104–111 | A searchlight sweeps the dark: presence, responsibility, company |
| outro | 112–132 | Title, then /Telos and credits |

## Shot list

| Beat | Time | Beats | Kind | Content | FX |
| --- | --- | --- | --- | --- | --- |
| 0 | 0.0 s | 2.5 | `black` | TAIPEI MEDICAL UNIVERSITY  ·  2026 |  |
| 2.5 | 1.0 s | 3.5 | `type` | Every tool expires. |  |
| 6 | 2.4 s | 4 | `wall` | product names struck through |  |
| 10 | 4.0 s | 4 | `type` | Some things don’t. |  |
| 14 | 5.6 s | 2 | `box` |  |  |
| 16 | 6.4 s | 2 | `letter` | Bash |  |
| 18 | 7.2 s | 2 | `letter` | Read |  |
| 20 | 8.0 s | 2 | `letter` | Edit |  |
| 22 | 8.8 s | 2 | `letter` | Write |  |
| 24 | 9.6 s | 1 | `verb` | Bash |  |
| 25 | 10.0 s | 1 | `verb` | Read |  |
| 26 | 10.4 s | 1 | `verb` | Edit |  |
| 27 | 10.8 s | 1 | `verb` | Write |  |
| 28 | 11.2 s | 3 | `log` |  |  |
| 31 | 12.4 s | 1 | `black` | LOOP | stutter |
| 32 | 12.8 s | 2 | `ring` | Read, Edit, Bash | flash |
| 34 | 13.6 s | 2 | `keyword` | /Learning |  |
| 36 | 14.4 s | 2 | `regress` |  |  |
| 38 | 15.2 s | 2 | `keyword` | /Stochastic |  |
| 40 | 16.0 s | 2 | `tokens` |  |  |
| 42 | 16.8 s | 2 | `keyword` | /Agency |  |
| 44 | 17.6 s | 2 | `keyword` | /Cybernetic |  |
| 46 | 18.4 s | 2 | `ring` | Glucose, β-cell, Insulin |  |
| 48 | 19.2 s | 2 | `keyword` | /Plaintext | flash |
| 50 | 20.0 s | 2 | `pipeline` |  |  |
| 52 | 20.8 s | 2 | `keyword` | /Translational |  |
| 54 | 21.6 s | 2 | `keyword` | /Situated |  |
| 56 | 22.4 s | 2 | `label` |  |  |
| 58 | 23.2 s | 2 | `keyword` | /Schema |  |
| 60 | 24.0 s | 2 | `keyword` | /Searchlight |  |
| 62 | 24.8 s | 2 | `keyword` | /Dramaturgical |  |
| 64 | 25.6 s | 8 | `phone` |  | glitch |
| 72 | 28.8 s | 2 | `rx` | Rx 01 · AI before GenAI. | flash |
| 74 | 29.6 s | 2 | `rx` | Rx 02 · Count the cost first. | flash |
| 76 | 30.4 s | 2 | `rx` | Rx 03 · A system, not just code. | flash |
| 78 | 31.2 s | 2 | `rx` | Rx 04 · Fix what people hate. | flash |
| 80 | 32.0 s | 2 | `rx` | Rx 05 · Not every task needs the frontier model. | flash |
| 82 | 32.8 s | 2 | `rx` | Rx 06 · Three times? Write it down. | flash |
| 84 | 33.6 s | 2 | `rx` | Rx 07 · Learn the command line. | flash |
| 86 | 34.4 s | 2 | `rx` | Rx 08 · Never the lethal trifecta. | flash |
| 88 | 35.2 s | 2 | `rx` | Rx 09 · Refine your own workflow. | flash |
| 90 | 36.0 s | 2 | `rx` | Rx 10 · Live an analog life. | flash |
| 92 | 36.8 s | 4 | `mosaic` |  | flash |
| 96 | 38.4 s | 4 | `stat` |  | flash |
| 100 | 40.0 s | 4 | `type` | What is left? |  |
| 104 | 41.6 s | 7 | `searchlight` |  |  |
| 111 | 44.4 s | 1 | `black` |  |  |
| 112 | 44.8 s | 8 | `title` |  | flash |
| 120 | 48.0 s | 8 | `end` |  |  |
| 128 | 51.2 s | 4 | `black` |  |  |

## Voice (vocoded, synthesized)

| Beat | Time | Line |
| --- | --- | --- |
| 2.5 | 1.0 s | Every tool expires |
| 10.5 | 4.2 s | Some things do not |
| 16.25 | 6.5 s | Bash |
| 18.25 | 7.3 s | Read |
| 20.25 | 8.1 s | Edit |
| 22.25 | 8.9 s | Write |
| 31 | 12.4 s | Loop |
| 64.25 | 25.7 s | Five questions |
| 68.25 | 27.3 s | Two were better |
| 100.25 | 40.1 s | What is left |
| 113 | 45.2 s | What does not expire |

## Sound

Score adapted from `htlin222/mograph-library` (F minor, 150 BPM): braams, four-on-the-floor kick with side-chain,
claps, 16th hats, reese bass, supersaw arp, risers, impacts; hard gaps at beats 31 and 111 leave only the voice.
Voice: espeak-ng through a 28-band channel vocoder on the score's chords, plus a pitched-down dry copy. Mix: the score
ducks under the voice; loudness normalised to −14 LUFS, true peak −1 dBTP.
