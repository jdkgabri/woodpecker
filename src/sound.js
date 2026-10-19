// Sounds from the Lichess "standard" set (Enigmahack / lila, AGPLv3+): public/sound/
import { getSettings } from './store.js';

const FILES = {
  move: 'Move', capture: 'Capture', check: 'Move', mate: 'Move',
  error: 'Error', success: 'Confirmation', notify: 'GenericNotify', select: 'Select',
};
const cache = {};

export function sound(name) {
  if (!getSettings().sound || !FILES[name]) return;
  try {
    const src = import.meta.env.BASE_URL + 'sound/' + FILES[name] + '.mp3';
    // one Audio per sound, cloned so they can overlap (quick captures, etc.)
    cache[name] = cache[name] || new Audio(src);
    const a = cache[name].paused ? cache[name] : cache[name].cloneNode();
    a.volume = name === 'error' ? 0.5 : 0.8;
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}
