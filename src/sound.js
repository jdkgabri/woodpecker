import { getSettings } from './store.js';

let ctx;
const TONES = {
  move: [[520, 0.05]],
  capture: [[380, 0.07]],
  check: [[660, 0.06], [760, 0.06]],
  mate: [[660, 0.08], [880, 0.12]],
  error: [[220, 0.15]],
  success: [[700, 0.07], [940, 0.1]],
};

export function sound(name) {
  if (!getSettings().sound) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    let t = ctx.currentTime;
    for (const [f, d] of TONES[name] || []) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.15, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + d + 0.02);
      t += d;
    }
  } catch {}
}
