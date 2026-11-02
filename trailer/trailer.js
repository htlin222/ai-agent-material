/* Trailer picture — 1920×1080, black ground, white ink, no hue anywhere.
   T.render(ctx, i) draws frame i as a pure function of time; the shot list is PLAN (plan.js).
   Visual grammar follows htlin222/mograph-library: corner marks, a mono title strip, a bar.beat counter,
   cuts and accents on the beat, a punch-zoom on every beat inside the drops. */
const T = { W: 1920, H: 1080, FPS: 30 };
(function () {
  const W = T.W, H = T.H, M = 140;
  T.frames = Math.round(PLAN.beats * TBEAT * T.FPS);
  const shotAt = b => PLAN.shots.find(s => b >= s.b && b < s.b + s.n) || PLAN.shots[PLAN.shots.length - 1];
  const inDrop = b => (b >= 32 && b < 64) || (b >= 72 && b < 104);
  const line = (ctx, pts, w = 4, a = 1) => { ctx.save(); ctx.strokeStyle = INK(a); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore(); };
  const partial = (pts, u) => {           // the first u (0..1) of a polyline, by length
    const seg = []; let L = 0; for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); seg.push(d); L += d; }
    let need = L * clamp(u), out = [pts[0]];
    for (let k = 1; k < pts.length && need > 0; k++) { const d = seg[k - 1]; if (need >= d) { out.push(pts[k]); need -= d; } else { const f = need / d; out.push([lerp(pts[k - 1][0], pts[k][0], f), lerp(pts[k - 1][1], pts[k][1], f)]); need = 0; } }
    return out;
  };
  const wipe = (ctx, u, fn) => { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * clamp(u), H); ctx.clip(); fn(); ctx.restore(); };

  /* ─────────────── shot kinds: (ctx, lb = local beats, p, shot) */
  const K = {};
  K.black = (ctx, lb, p, s) => {
    if (p.text) text(ctx, p.text, W / 2, H / 2 + 8, { size: 24, family: F.mono, weight: 400, align: 'center', alpha: ease(E.outCubic, 0.3, 1.2, lb) * 0.8, spacing: 6 });
    if (p.big) { const on = Math.floor(lb * 8) % 2 === 0 || lb > 0.5; if (on) text(ctx, p.big, W / 2, H / 2 + 80, { size: 240, weight: 900, align: 'center', spacing: 24 }); }
  };
  K.type = (ctx, lb, p) => {
    const n = Math.floor(clamp(lb / 1.2) * p.text.length), shown = p.text.slice(0, n);
    const size = 132; text(ctx, shown, M, H / 2 + 46, { size, weight: 800 });
    font(ctx, size, F.sans, 800); const x = M + ctx.measureText(shown).width + 14;
    if (Math.floor(lb * 2) % 2 === 0 || n < p.text.length) { ctx.fillStyle = INK(1); ctx.fillRect(x, H / 2 - 56, 10, 116); }
  };
  K.wall = (ctx, lb, p) => {
    p.words.forEach((w, k) => {
      const col = k % 3, row = Math.floor(k / 3), x = M + col * 560, y = 330 + row * 200;
      const ts = 0.25 + k * 0.4, u = ease(E.outCubic, ts, ts + 0.18, lb), gone = ease(E.outCubic, ts + 0.1, ts + 0.6, lb);
      text(ctx, w, x, y, { size: 78, weight: 700, alpha: 1 - 0.78 * gone });
      if (u > 0) { font(ctx, 78, F.sans, 700); const wd = ctx.measureText(w).width; line(ctx, [[x - 10, y - 26], [x - 10 + (wd + 20) * u, y - 26]], 7); }
    });
    text(ctx, 'THIS LIST EXPIRES NEXT YEAR', M, 170, { size: 24, family: F.mono, weight: 400, alpha: 0.6, spacing: 4 });
  };
  K.box = (ctx, lb) => {
    const cx = W / 2, cy = 640, s = 230, dx = s * Math.cos(Math.PI / 6), dy = s * Math.sin(Math.PI / 6);
    const top = [[cx, cy - 2 * dy], [cx + dx, cy - dy], [cx, cy], [cx - dx, cy - dy]], bot = top.map(([x, y]) => [x, y + s]);
    const u = ease(E.inOutCubic, 0, 0.9, lb);
    line(ctx, partial([top[3], top[2], top[1], bot[1], bot[2], bot[3], top[3]], u), 6);
    line(ctx, partial([top[2], bot[2]], u), 6);
    const lift = 240 * ease(E.outBack, 1.0, 1.6, lb), tilt = 0.18 * ease(E.outCubic, 1.0, 1.6, lb);
    ctx.save(); ctx.translate(cx, cy - dy - lift); ctx.rotate(-tilt); ctx.translate(-cx, -(cy - dy));
    line(ctx, partial([...top, top[0]], u), 6); ctx.restore();
    text(ctx, 'ENCAPSULATION', W / 2, 1000, { size: 24, family: F.mono, weight: 400, align: 'center', alpha: 0.6 * ease(E.outCubic, 1, 1.4, lb), spacing: 6 });
  };
  K.letter = (ctx, lb, p) => {
    const u = ease(E.outExpo, 0, 0.35, lb);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 1000 - 900 * u, 960, 900 * u); ctx.clip();
    text(ctx, p.ch, M - 20, 900, { size: 860, weight: 900 }); ctx.restore();
    const v = ease(E.outCubic, 0.2, 0.6, lb);
    text(ctx, `0${p.k} / 04`, 1060, 430, { size: 26, family: F.mono, weight: 400, alpha: 0.6 * v, spacing: 4 });
    text(ctx, p.word, 1060 + (1 - v) * 60, 600, { size: 150, weight: 800, alpha: v });
  };
  K.verb = (ctx, lb, p) => {
    const z = 1 + 0.25 * Math.exp(-lb * 9);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z);
    text(ctx, p.word, 0, 95, { size: 300, weight: 900, align: 'center' }); ctx.restore();
  };
  K.log = (ctx, lb) => {
    const L = [['Read', 'reports/2026-10-28_CT.txt'], ['Read', 'notes/summary.md'], ['Edit', 'notes/summary.md'], ['Bash', 'check_format notes/summary.md'],
      ['Edit', 'notes/summary.md'], ['Bash', 'check_format notes/summary.md'], ['Write', 'notes/summary_v2.md']];
    L.forEach(([v, a], k) => {
      const t0 = k * 0.36; if (lb < t0) return;
      const n = Math.floor(clamp((lb - t0) / 0.3) * a.length), y = 260 + k * 92;
      text(ctx, v.padEnd(6, ' '), M + 80, y, { size: 52, family: F.mono, weight: 700 });
      text(ctx, a.slice(0, n), M + 80 + 230, y, { size: 52, family: F.mono, weight: 400, alpha: 0.55 });
    });
  };
  K.ring = (ctx, lb, p) => {
    const cx = W / 2, cy = H / 2 + 10, R = 330, n = p.labels.length, hot = Math.floor(lb * 2) % n;
    const draw = ease(E.inOutCubic, 0, 0.5, lb);
    ctx.save(); ctx.strokeStyle = INK(0.9); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * draw); ctx.stroke(); ctx.restore();
    const a = -Math.PI / 2 + lb * Math.PI; ctx.fillStyle = INK(1); ctx.beginPath(); ctx.arc(cx + R * Math.cos(a), cy + R * Math.sin(a), 12, 0, Math.PI * 2); ctx.fill();
    p.labels.forEach((lab, k) => {
      const t = -Math.PI / 2 + k * Math.PI * 2 / n, x = cx + R * Math.cos(t), y = cy + R * Math.sin(t), on = k === hot;
      ctx.fillStyle = on ? INK(1) : VOID(1); ctx.strokeStyle = INK(1); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 112, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      text(ctx, lab, x, y + 16, { size: lab.length > 7 ? 38 : 46, weight: 700, align: 'center', color: on ? VOID(1) : INK(1) });
    });
    text(ctx, p.center, cx, cy + 12, { size: 30, family: F.mono, weight: 400, align: 'center', alpha: 0.6, spacing: 4 });
  };
  K.keyword = (ctx, lb, p) => {
    const u = ease(E.outExpo, 0, 0.3, lb), size = fitSize(ctx, p.word, W - 2 * M, 250);
    wipe(ctx, u, () => text(ctx, p.word, M, 610, { size, weight: 900 }));
    text(ctx, p.sub.toUpperCase(), M + 8, 720, { size: 30, family: F.mono, weight: 400, alpha: 0.65 * ease(E.outCubic, 0.25, 0.6, lb), spacing: 3 });
  };
  const PTS = (() => { const r = rng(7), out = []; for (let k = 0; k < 34; k++) { const x = 0.04 + 0.92 * r(); out.push([x, clamp(0.62 * x + 0.12 + (r() - 0.5) * 0.24, 0.03, 0.97)]); } return out; })();
  K.regress = (ctx, lb) => {
    const ox = 380, oy = 900, ex = 1540, ey = 180, X = x => ox + x * (ex - ox), Y = y => oy - y * (oy - ey);
    line(ctx, [[ox, ey], [ox, oy], [ex, oy]], 4, 0.7);
    PTS.forEach(([x, y], k) => { if (lb > k * 0.015) { ctx.fillStyle = INK(1); ctx.beginPath(); ctx.arc(X(x), Y(y), 10, 0, Math.PI * 2); ctx.fill(); } });
    const f = ease(E.inOutCubic, 0.5, 1.6, lb), a = lerp(-0.1, 0.62, f), b = lerp(0.6, 0.12, f);
    PTS.forEach(([x, y], k) => { if (k % 3 === 0) line(ctx, [[X(x), Y(y)], [X(x), Y(a * x + b)]], 3, 0.4); });
    line(ctx, [[X(0), Y(b)], [X(1), Y(a + b)]], 7);
    text(ctx, `a = ${a.toFixed(2)}   b = ${b.toFixed(2)}`, ox, 140, { size: 34, family: F.mono, weight: 400, alpha: 0.75 });
  };
  K.tokens = (ctx, lb) => {
    const A = [['pneumonia', .46], ['heart failure', .21], ['pulmonary embolism', .12], ['COPD exacerbation', .08]];
    const B = [['heart failure', .38], ['pneumonia', .29], ['pulmonary embolism', .17], ['COPD exacerbation', .06]];
    const second = lb >= 1, D = second ? B : A, u = ease(E.outCubic, second ? 1 : 0, (second ? 1 : 0) + 0.5, lb);
    text(ctx, 'The most likely diagnosis is', M, 330, { size: 64, weight: 700 });
    text(ctx, second ? 'SAMPLE 2' : 'SAMPLE 1', M, 230, { size: 26, family: F.mono, weight: 400, alpha: 0.6, spacing: 4 });
    D.forEach(([w, pr], k) => {
      const y = 500 + k * 120, top = k === 0;
      text(ctx, w, M + 560, y + 18, { size: 46, weight: top ? 800 : 500, align: 'right', alpha: top ? 1 : 0.6 });
      ctx.fillStyle = INK(top ? 1 : 0.4); ctx.fillRect(M + 600, y - 22, 1000 * pr * u, 44);
      text(ctx, pr.toFixed(2), M + 620 + 1000 * pr * u, y + 16, { size: 38, family: F.mono, weight: 400, alpha: top ? 1 : 0.6 });
    });
  };
  K.pipeline = (ctx, lb) => {
    const steps = [['Report in', 'Read'], ['Draft', 'Write'], ['Check', 'Bash'], ['Compare prior', 'Read'], ['Save version', 'Write']];
    const bw = 300, gap = 52, y = 560, x0 = (W - (5 * bw + 4 * gap)) / 2;
    // packet path: 0 → 1 → 2 → back to 1 → 2 → 3 → 4
    const route = [0, 1, 2, 1, 2, 3, 4], pos = clamp(lb / 1.8) * (route.length - 1), at = route[Math.round(pos)];
    steps.forEach(([lab, verb], k) => {
      const x = x0 + k * (bw + gap), on = k === at;
      ctx.fillStyle = on ? INK(1) : VOID(1); ctx.strokeStyle = INK(1); ctx.lineWidth = 4; ctx.fillRect(x, y - 85, bw, 170); ctx.strokeRect(x, y - 85, bw, 170);
      text(ctx, lab, x + bw / 2, y + 14, { size: 40, weight: 700, align: 'center', color: on ? VOID(1) : INK(1) });
      text(ctx, verb, x + bw / 2, y + 150, { size: 32, family: F.mono, weight: 400, align: 'center', alpha: 0.6 });
      if (k) line(ctx, [[x - gap + 6, y], [x - 8, y]], 4, 0.8);
    });
    const a = x0 + 2 * (bw + gap) + bw / 2, b = x0 + 1 * (bw + gap) + bw / 2;
    line(ctx, [[a, y - 85], [a, y - 190], [b, y - 190], [b, y - 92]], 4, 0.8);
    text(ctx, 'FAILS → REDO', (a + b) / 2, y - 215, { size: 26, family: F.mono, weight: 400, align: 'center', alpha: 0.6, spacing: 3 });
  };
  K.label = (ctx, lb) => {
    const x0 = 260, x1 = W - 260; ctx.strokeStyle = INK(1); ctx.lineWidth = 4; ctx.strokeRect(x0, 130, x1 - x0, 820);
    text(ctx, 'Codeximab®  Claudixumab®  Geminimumab®', x0 + 50, 215, { size: 54, weight: 800 });
    text(ctx, 'STOCHASTIC NEXT-TOKEN PREDICTOR', x0 + 50, 268, { size: 24, family: F.mono, weight: 400, alpha: 0.6, spacing: 3 });
    const rows = [['Indications', 'First drafts: summaries, letters, literature search'], ['Dosage', 'Smallest effective model for the task'],
      ['Adverse effects', 'Hallucination, overconfidence, sycophancy'], ['Interactions', 'Untrusted content: prompt injection']];
    rows.forEach(([k, v], i) => { const a = ease(E.outCubic, 0.15 + i * 0.22, 0.3 + i * 0.22, lb); text(ctx, k, x0 + 50, 370 + i * 86, { size: 36, weight: 800, alpha: a }); text(ctx, v, x0 + 440, 370 + i * 86, { size: 36, weight: 400, alpha: a }); });
    const s = ease(E.outBack, 1.2, 1.45, lb);
    if (s > 0) {
      ctx.save(); ctx.translate(W / 2, 790); ctx.scale(lerp(1.4, 1, s), lerp(1.4, 1, s)); ctx.globalAlpha = clamp(s);
      ctx.lineWidth = 12; ctx.strokeStyle = INK(1); ctx.strokeRect(-(x1 - x0) / 2 + 40, -95, x1 - x0 - 80, 190);
      text(ctx, 'BOXED WARNING', -(x1 - x0) / 2 + 90, -22, { size: 40, weight: 900 });
      text(ctx, 'Not for unsupervised clinical decisions. A physician signs.', -(x1 - x0) / 2 + 90, 48, { size: 38, weight: 600 });
      ctx.restore();
    }
  };
  K.phone = (ctx, lb) => {
    const x0 = 360, y0 = 120, w = 430, h = 840;
    ctx.strokeStyle = INK(1); ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 60); ctx.stroke();
    ctx.fillStyle = INK(1); ctx.beginPath(); ctx.roundRect(x0 + w / 2 - 50, y0 + 30, 100, 14, 7); ctx.fill();
    const lens = [.78, .92, .64, .86, .7];
    lens.forEach((ln, k) => {
      const y = y0 + 170 + k * 140, appear = ease(E.outCubic, 0.4 + k * 0.35, 0.8 + k * 0.35, lb), hot = (k === 1 || k === 3) && lb > 3.5;
      const a = appear * (hot ? 1 : 0.35);
      text(ctx, `${k + 1}.`, x0 + 50, y + 12, { size: 34, weight: 700, alpha: a });
      ctx.fillStyle = INK(a); ctx.fillRect(x0 + 110, y - 18, 250 * ln * appear, 14); ctx.fillRect(x0 + 110, y + 12, 160 * ln * appear, 14);
    });
    text(ctx, 'Five questions.', 900, 470, { size: 84, weight: 800, alpha: ease(E.outCubic, 0.4, 1.0, lb) });
    text(ctx, 'Two were sharper', 900, 600, { size: 60, weight: 500, alpha: ease(E.outCubic, 4.2, 4.8, lb) * 0.85 });
    text(ctx, 'than a resident’s.', 900, 680, { size: 60, weight: 500, alpha: ease(E.outCubic, 4.4, 5.0, lb) * 0.85 });
  };
  K.rx = (ctx, lb, p) => {
    const u = ease(E.outExpo, 0, 0.3, lb);
    text(ctx, 'Rx', M, 300, { size: 40, family: F.mono, weight: 400, alpha: 0.6, spacing: 4 });
    text(ctx, String(p.n).padStart(2, '0'), M - 10 + (1 - u) * -80, 720, { size: 420, weight: 900, alpha: u });
    const words = p.text.split(' '); const lines = []; let cur = '';
    font(ctx, 82, F.sans, 800); for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (ctx.measureText(t).width > 860 && cur) { lines.push(cur); cur = wd; } else cur = t; } lines.push(cur);
    lines.forEach((l, k) => text(ctx, l, 900, 520 + k * 100 - (lines.length - 1) * 50, { size: 82, weight: 800, alpha: ease(E.outCubic, 0.1 + k * 0.08, 0.4 + k * 0.08, lb) }));
  };
  const KW = ['Learning', 'Stochastic', 'Agency', 'BREW', 'Cybernetic', 'Plaintext', 'Translational', 'Situated', 'Schema', 'Searchlight', 'Dramaturgical', 'Telos', 'Huh?', 'Encapsulation', 'Rx'];
  K.mosaic = (ctx, lb) => {
    const cols = 5, rows = 3, cw = (W - 2 * 80) / cols, ch = (H - 2 * 120) / rows, r = rng(5), order = KW.map((_, k) => k).sort(() => r() - 0.5);
    KW.forEach((w, k) => {
      const c = k % cols, rr = Math.floor(k / cols), x = 80 + c * cw, y = 120 + rr * ch, on = lb * 4 > order.indexOf(k) * 0.9;
      if (!on) return; const inv = (Math.floor(lb) + k) % 5 === 0;
      if (inv) { ctx.fillStyle = INK(1); ctx.fillRect(x + 6, y + 6, cw - 12, ch - 12); }
      else { ctx.strokeStyle = INK(0.35); ctx.lineWidth = 2; ctx.strokeRect(x + 6, y + 6, cw - 12, ch - 12); }
      const size = fitSize(ctx, '/' + w, cw - 60, 52, F.sans, 800);
      text(ctx, '/' + w, x + 30, y + ch / 2 + 18, { size, weight: 800, color: inv ? VOID(1) : INK(1) });
    });
  };
  K.stat = (ctx, lb) => {
    const v = 78.6 * ease(E.outCubic, 0, 1.6, lb);
    text(ctx, v.toFixed(1) + '%', M - 10, 640, { size: 360, weight: 900 });
    text(ctx, 'of 585 evaluations preferred the chatbot’s answer', M, 780, { size: 46, weight: 500, alpha: ease(E.outCubic, 1.2, 1.8, lb) });
    text(ctx, 'AYERS ET AL., JAMA INTERNAL MEDICINE, 2023', M, 860, { size: 26, family: F.mono, weight: 400, alpha: 0.6 * ease(E.outCubic, 1.6, 2.2, lb), spacing: 3 });
  };
  K.searchlight = (ctx, lb, p) => {
    const lamp = [220, 980], ang = lerp(-1.25, -0.2, ease(E.inOutCubic, 0, 6.6, lb)), spread = 0.16, L = 2600;
    const pos = [[760, 330], [1180, 560], [1520, 830]];
    const r = rng(11); for (let k = 0; k < 60; k++) { ctx.fillStyle = INK(0.08); ctx.beginPath(); ctx.arc(80 + r() * 1760, 80 + r() * 900, 6, 0, Math.PI * 2); ctx.fill(); }
    p.words.forEach((w, k) => text(ctx, w, pos[k][0], pos[k][1], { size: 72, weight: 800, align: 'center', alpha: 0.06 }));
    ctx.save(); ctx.beginPath(); ctx.moveTo(...lamp);
    ctx.lineTo(lamp[0] + L * Math.cos(ang - spread), lamp[1] + L * Math.sin(ang - spread)); ctx.lineTo(lamp[0] + L * Math.cos(ang + spread), lamp[1] + L * Math.sin(ang + spread)); ctx.closePath();
    ctx.fillStyle = INK(1); ctx.fill(); ctx.clip();
    const r2 = rng(11); for (let k = 0; k < 60; k++) { ctx.fillStyle = VOID(1); ctx.beginPath(); ctx.arc(80 + r2() * 1760, 80 + r2() * 900, 6, 0, Math.PI * 2); ctx.fill(); }
    p.words.forEach((w, k) => text(ctx, w, pos[k][0], pos[k][1], { size: 72, weight: 800, align: 'center', color: VOID(1) }));
    ctx.restore();
    ctx.fillStyle = INK(1); ctx.beginPath(); ctx.arc(...lamp, 22, 0, Math.PI * 2); ctx.fill();
  };
  K.title = (ctx, lb) => {
    wipe(ctx, ease(E.outExpo, 0, 0.6, lb), () => text(ctx, 'AI Agents in Clinical Medicine', M, 520, { size: 118, weight: 900 }));
    text(ctx, 'What does not expire', M, 640, { size: 72, weight: 500, alpha: 0.7 * ease(E.outCubic, 1, 2, lb) });
  };
  K.end = (ctx, lb) => {
    const a = k => ease(E.outCubic, k * 0.5, k * 0.5 + 1, lb);
    text(ctx, '/Telos', M, 420, { size: 150, weight: 900, alpha: a(0) });
    text(ctx, 'Hsieh-Ting Lin, MD', M, 580, { size: 52, weight: 700, alpha: a(1) });
    text(ctx, 'Taipei Medical University · 2026', M, 660, { size: 44, weight: 400, alpha: 0.7 * a(2) });
    text(ctx, 'github.com/htlin222/ai-agent-material', M, 800, { size: 30, family: F.mono, weight: 400, alpha: 0.6 * a(3) });
  };

  function chrome(ctx, b) {
    ctx.save(); ctx.strokeStyle = INK(0.35); ctx.lineWidth = 2;
    for (const [x, y, sx, sy] of [[24, 24, 1, 1], [W - 24, 24, -1, 1], [24, H - 24, 1, -1], [W - 24, H - 24, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * 26); ctx.lineTo(x, y); ctx.lineTo(x + sx * 26, y); ctx.stroke(); }
    ctx.restore();
    text(ctx, 'AI AGENTS IN CLINICAL MEDICINE · TMU 2026', 60, H - 40, { size: 18, family: F.mono, weight: 400, alpha: 0.45, spacing: 2 });
    const bar = Math.floor(b / 4) + 1, bt = Math.floor(b % 4) + 1;
    text(ctx, `${String(bar).padStart(2, '0')}.${bt}`, W - 60, H - 40, { size: 18, family: F.mono, weight: 400, align: 'right', alpha: 0.45, spacing: 2 });
  }

  T.render = function (ctx, i) {
    const t = i / T.FPS, b = t / TBEAT, s = shotAt(b), lb = b - s.b;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = VOID(1); ctx.fillRect(0, 0, W, H);
    const z = inDrop(b) ? 1 + 0.03 * Math.exp(-fract(b) * 7) : 1;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    K[s.kind](ctx, lb, s.p, s);
    ctx.restore();
    if (s.fx.glitch) for (const g of s.fx.glitch) {
      const d = b - g; if (d >= 0 && d < 0.15) { const r = rng(Math.floor(g * 100)); for (let k = 0; k < 7; k++) { const y = r() * H, h = 20 + r() * 90, dx = (r() - 0.5) * 240; ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h); } }
    }
    if (s.fx.flash && lb < 0.25) { ctx.fillStyle = INK(1 - lb / 0.25); ctx.fillRect(0, 0, W, H); }
    chrome(ctx, b);
  };
})();
