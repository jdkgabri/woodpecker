// Etiquetas que el código traduce con t(variable)
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../src/puzzles.js', import.meta.url), 'utf8');
const pick = re => [...src.matchAll(re)].map(m => m[1]);
export const WP_LEVELS_LABELS = pick(/label: '([^']+)'/g);
const block = name => src.slice(src.indexOf(`export const ${name}`), src.indexOf('];', src.indexOf(`export const ${name}`)));
export const THEME_LABELS = [...block('LICHESS_THEMES').matchAll(/\['\w+', '([^']+)'\]/g)].map(m => m[1]);
export const DIFF_LABELS = [...block('LICHESS_DIFFS').matchAll(/\['\w+', '([^']+)'\]/g)].map(m => m[1]);
