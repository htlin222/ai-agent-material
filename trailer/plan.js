/* Trailer edit decision list — 16:9, 1920×1080, 30 fps, 150 BPM (beat 0.4 s, bar 1.6 s).
   Every time is in BEATS from the start. Shared by the picture (trailer.js), the score (music.js) and the
   voice (vo.py reads the exported plan.json).
   shot: { b: start beat, n: length in beats, kind, p: parameters, fx: { flash, punch, glitch: [beats], stutter } }
   The section grid matches music.js (adapted from htlin222/mograph-library). */
const TBPM = 150, TBEAT = 60 / TBPM, TBAR = TBEAT * 4;
const PLAN = {
  bpm: TBPM, beats: 132,
  sections: [
    { name: 'intro', b: 0, n: 16 }, { name: 'build', b: 16, n: 16 }, { name: 'drop1', b: 32, n: 32 },
    { name: 'break', b: 64, n: 8 }, { name: 'drop2', b: 72, n: 32 }, { name: 'rise', b: 104, n: 8 },
    { name: 'outro', b: 112, n: 20 },
  ],
  vo: [
    { b: 2.5, text: 'Every tool expires', id: 'expires' },
    { b: 10.5, text: 'Some things do not', id: 'donot' },
    { b: 16.25, text: 'Bash', id: 'bash' },
    { b: 18.25, text: 'Read', id: 'read' },
    { b: 20.25, text: 'Edit', id: 'edit' },
    { b: 22.25, text: 'Write', id: 'write' },
    { b: 31, text: 'Loop', id: 'loop', chop: true },
    { b: 64.25, text: 'Five questions', id: 'five' },
    { b: 68.25, text: 'Two were better', id: 'two' },
    { b: 100.25, text: 'What is left', id: 'left' },
    { b: 113, text: 'What does not expire', id: 'outro' },
  ],
  chops: [
    ...[33.5, 37.5, 41.5, 45.5, 49.5, 53.5, 57.5, 61.5].map(b => ({ b, word: 'loop', pitch: 7 })),
    ...[74.5, 78.5, 82.5, 86.5, 90.5, 94.5, 98.5].map(b => ({ b, word: 'write', pitch: 12 })),
    { b: 101.5, word: 'write', pitch: 0, stutter: 4 },
  ],
  shots: [],
};
(function () {
  const S = (b, n, kind, p = {}, fx = {}) => PLAN.shots.push({ b, n, kind, p, fx });
  /* intro — slow */
  S(0, 2.5, 'black', { text: 'TAIPEI MEDICAL UNIVERSITY  ·  2026' });
  S(2.5, 3.5, 'type', { text: 'Every tool expires.' });
  S(6, 4, 'wall', { words: ['OpenClaw', 'NotebookLM', 'n8n', 'Photoshop', 'ChatGPT', 'Gemini', 'Copilot', 'Cursor', 'Perplexity'] });
  S(10, 4, 'type', { text: 'Some things don’t.' });
  S(14, 2, 'box', {});
  /* build — the four verbs */
  S(16, 2, 'letter', { ch: 'B', word: 'Bash', k: 1 });
  S(18, 2, 'letter', { ch: 'R', word: 'Read', k: 2 });
  S(20, 2, 'letter', { ch: 'E', word: 'Edit', k: 3 });
  S(22, 2, 'letter', { ch: 'W', word: 'Write', k: 4 });
  ['Bash', 'Read', 'Edit', 'Write'].forEach((w, i) => S(24 + i, 1, 'verb', { word: w }));
  S(28, 3, 'log', {});
  S(31, 1, 'black', { big: 'LOOP' }, { stutter: true });
  /* drop 1 — thirteen words, a diagram between them */
  S(32, 2, 'ring', { labels: ['Read', 'Edit', 'Bash'], center: 'agent' }, { flash: true });
  S(34, 2, 'keyword', { word: '/Learning', sub: 'from a number to the next word' });
  S(36, 2, 'regress', {});
  S(38, 2, 'keyword', { word: '/Stochastic', sub: 'same question, different answer' });
  S(40, 2, 'tokens', {});
  S(42, 2, 'keyword', { word: '/Agency', sub: 'LLM + tools + loop' });
  S(44, 2, 'keyword', { word: '/Cybernetic', sub: 'a feedback loop' });
  S(46, 2, 'ring', { labels: ['Glucose', 'β-cell', 'Insulin'], center: 'body' });
  S(48, 2, 'keyword', { word: '/Plaintext', sub: 'the native language of agents' }, { flash: true });
  S(50, 2, 'pipeline', {});
  S(52, 2, 'keyword', { word: '/Translational', sub: 'code → clinic' });
  S(54, 2, 'keyword', { word: '/Situated', sub: 'WBC 15,000: ED or clinic?' });
  S(56, 2, 'label', {});
  S(58, 2, 'keyword', { word: '/Schema', sub: 'structure, not volume' });
  S(60, 2, 'keyword', { word: '/Searchlight', sub: 'you decide where to point it' });
  S(62, 2, 'keyword', { word: '/Dramaturgical', sub: 'front stage · back stage' });
  /* break — the patient's phone */
  S(64, 8, 'phone', {}, { glitch: [70.5, 71, 71.5] });
  /* drop 2 — ten prescriptions, then the number */
  const RX = ['AI before GenAI.', 'Count the cost first.', 'A system, not just code.', 'Fix what people hate.',
    'Not every task needs the frontier model.', 'Three times? Write it down.', 'Learn the command line.',
    'Never the lethal trifecta.', 'Refine your own workflow.', 'Live an analog life.'];
  RX.forEach((t, i) => S(72 + i * 2, 2, 'rx', { n: i + 1, text: t }, { flash: i === 0 || i === 6 }));
  S(92, 4, 'mosaic', {}, { flash: true });
  S(96, 4, 'stat', {}, { flash: true });
  S(100, 4, 'type', { text: 'What is left?' });
  /* rise — the searchlight */
  S(104, 7, 'searchlight', { words: ['presence', 'responsibility', 'company'] });
  S(111, 1, 'black', {});
  /* outro */
  S(112, 8, 'title', {}, { flash: true });
  S(120, 8, 'end', {});
  S(128, 4, 'black', {});
})();
