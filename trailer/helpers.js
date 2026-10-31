/* Small shared helpers (deterministic RNG, easing, text, WAV encoding). Everything is a pure function of time. */
function rng(seed = 1) {
  let a = seed >>> 0;
  const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  return r;
}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const fract = x => x - Math.floor(x);
const E = {
  outCubic: u => 1 - Math.pow(1 - u, 3),
  inOutCubic: u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
  outExpo: u => u >= 1 ? 1 : 1 - Math.pow(2, -10 * u),
  outBack: u => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
};
/* ease(curve, a, b, x): 0 before a, 1 after b */
const ease = (f, a, b, x) => f(clamp((x - a) / (b - a)));
const F = { sans: 'Inter, "Noto Sans CJK TC", sans-serif', mono: '"DejaVu Sans Mono", monospace' };
const INK = (a = 1) => `rgba(242,242,242,${a})`;
const VOID = (a = 1) => `rgba(0,0,0,${a})`;
function font(ctx, size, family = F.sans, weight = 700) { ctx.font = `${weight} ${size}px ${family}`; }
function text(ctx, s, x, y, o = {}) {
  const { size = 40, family = F.sans, weight = 700, align = 'left', baseline = 'alphabetic', alpha = 1, color = INK(1), spacing = 0 } = o;
  if (alpha <= 0) return;
  ctx.save(); font(ctx, size, family, weight); ctx.textAlign = align; ctx.textBaseline = baseline; ctx.globalAlpha *= alpha; ctx.fillStyle = color;
  if (spacing) ctx.letterSpacing = spacing + 'px';
  ctx.fillText(s, x, y); ctx.restore();
}
function fitSize(ctx, s, maxW, maxSize, family = F.sans, weight = 900) {
  font(ctx, maxSize, family, weight); const w = ctx.measureText(s).width; return w > maxW ? Math.floor(maxSize * maxW / w) : maxSize;
}
const MUS = { SR: 48000 };
MUS.wavF32 = function (L, R) {
  const n = L.length, ab = new ArrayBuffer(44 + n * 8), v = new DataView(ab);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 8, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 3, true); v.setUint16(22, 2, true);
  v.setUint32(24, MUS.SR, true); v.setUint32(28, MUS.SR * 8, true); v.setUint16(32, 8, true); v.setUint16(34, 32, true); w(36, 'data'); v.setUint32(40, n * 8, true);
  for (let i = 0; i < n; i++) { v.setFloat32(44 + i * 8, L[i], true); v.setFloat32(48 + i * 8, R[i], true); }
  const bytes = new Uint8Array(ab); let s = ''; const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(s);
};
