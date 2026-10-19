// Etiquetas que el código traduce con t(variable)
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
const puzzles = read('puzzles.js');
const block = (src, name) => src.slice(src.indexOf(`export const ${name}`), src.indexOf('];', src.indexOf(`export const ${name}`)));

export const WP_LEVELS_LABELS = [...puzzles.matchAll(/label: '([^']+)'/g)].map(m => m[1]);
export const THEME_LABELS = [...block(puzzles, 'LICHESS_THEMES').matchAll(/\['\w+', '([^']+)'\]/g)].map(m => m[1]);
export const DIFF_LABELS = [...block(puzzles, 'LICHESS_DIFFS').matchAll(/\['\w+', '([^']+)'\]/g)].map(m => m[1]);

const progress = read('progress.js');
export const RANK_LABELS = [...block(progress, 'RANKS').matchAll(/\[\d+, '([^']+)'\]/g)].map(m => m[1]);
export const ACHIEVEMENT_LABELS = [...block(progress, 'ACHIEVEMENTS').matchAll(/\['\w+', '[^']+', '([^']+)', '([^']+)'/g)].flatMap(m => [m[1], m[2]]);
