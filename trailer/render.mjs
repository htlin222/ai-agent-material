// Render the trailer from the repo root:
//   node trailer/render.mjs plan                 → trailer/build/plan.json (for vo.py)
//   node trailer/render.mjs stills 0,120,600     → trailer/build/frames/*.png + sheet.png
//   node trailer/render.mjs video [a-b] [workers] → trailer/build/part_*.mp4
//   node trailer/render.mjs music                → trailer/build/music.wav
// Adapted from htlin222/mograph-library (films/02-black-and-white/trailer/render.mjs).
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn, execFileSync } from 'child_process';
import fs from 'fs';
const ROOT = process.cwd(), URL = 'file://' + ROOT + '/trailer/page.html?record=1';
const open = async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1000, height: 600 } }), errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto(URL);
  await p.waitForFunction(() => window.T && T.readyFlag, null, { timeout: 120000 }).catch(() => { console.log(errs.join('\n')); throw new Error('boot failed'); });
  p.errs = errs; return { b, p };
};
const [mode, ...rest] = process.argv.slice(2);
fs.mkdirSync('trailer/build/frames', { recursive: true });
if (mode === 'plan') {
  const src = ['helpers.js', 'plan.js'].map(f => fs.readFileSync('trailer/' + f, 'utf8')).join('\n');
  const { PLAN, TBEAT } = new Function(src + '; return { PLAN, TBEAT };')();
  fs.writeFileSync('trailer/build/plan.json', JSON.stringify({ ...PLAN, beat: TBEAT }, null, 1)); console.log('plan.json', PLAN.shots.length, 'shots');
}
if (mode === 'stills') {
  const { b, p } = await open(); const files = [];
  for (const f of rest[0].split(',').map(Number)) { const url = await p.evaluate(i => T.frameURL(i), f); const out = `trailer/build/frames/f${String(f).padStart(4, '0')}.png`; fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); files.push(out); }
  const cols = Math.min(4, files.length);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap(f => ['-i', f]), '-filter_complex',
    files.map((_, i) => `[${i}:v]scale=480:270[s${i}]`).join(';') + ';' + files.map((_, i) => `[s${i}]`).join('') +
    `xstack=inputs=${files.length}:layout=` + files.map((_, i) => `${(i % cols) * 480}_${Math.floor(i / cols) * 270}`).join('|') + ':fill=gray',
    'trailer/build/sheet.png']);
  if (p.errs.length) console.log([...new Set(p.errs)].slice(0, 10).join('\n'));
  console.log('trailer/build/sheet.png'); await b.close();
}
if (mode === 'video') {
  const { b: b0, p: p0 } = await open(); const N = await p0.evaluate(() => T.frames); await b0.close();
  const [a, z] = (rest[0] || `0-${N}`).split('-').map(Number), W = +(rest[1] || 1), step = Math.ceil((z - a) / W);
  await Promise.all([...Array(W)].map(async (_, w) => {
    const s = a + w * step, e = Math.min(z, s + step); if (s >= e) return;
    const { b, p } = await open(), out = `trailer/build/part_${String(s).padStart(4, '0')}.mp4`;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', '30', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let i = s; i < e; i++) {
      const url = await p.evaluate(k => T.frameURL(k), i);
      if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if ((i - s) % 150 === 0) console.log(`[w${w}] ${i}/${e} ${((Date.now() - t0) / (i - s + 1)).toFixed(0)}ms/f`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done', out);
  }));
}
if (mode === 'music') {
  const { b, p } = await open(); const t0 = Date.now();
  const b64 = await p.evaluate(async () => await TMUS.render());
  fs.writeFileSync('trailer/build/music.wav', Buffer.from(b64, 'base64')); console.log('music.wav', ((Date.now() - t0) / 1000).toFixed(0) + 's');
  if (p.errs.length) console.log(p.errs.slice(0, 5).join('\n'));
  await b.close();
}
