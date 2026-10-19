// Labels that the code translates with t(variable)
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
const block = (src, name) => src.slice(src.indexOf(`export const ${name}`), src.indexOf('];', src.indexOf(`export const ${name}`)));
const q = String.raw`(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")`;
const pick = m => m[1] ?? m[2];

const puzzles = read('puzzles.js');
export const WP_LEVELS_LABELS = [...puzzles.matchAll(new RegExp('label: ' + q, 'g'))].map(pick);
export const THEME_LABELS = [...block(puzzles, 'LICHESS_THEMES').matchAll(new RegExp(String.raw`\['\w+', ` + q + String.raw`\]`, 'g'))].map(pick);
export const DIFF_LABELS = [...block(puzzles, 'LICHESS_DIFFS').matchAll(new RegExp(String.raw`\['\w+', ` + q + String.raw`\]`, 'g'))].map(pick);

const progress = read('progress.js');
export const RANK_LABELS = [...block(progress, 'RANKS').matchAll(new RegExp(String.raw`\[\d+, ` + q + String.raw`\]`, 'g'))].map(pick);
export const ACHIEVEMENT_LABELS = [...block(progress, 'ACHIEVEMENTS').matchAll(new RegExp(String.raw`\['\w+', '[^']+', ` + q + ', ' + q, 'g'))]
  .flatMap(m => [m[1] ?? m[2], m[3] ?? m[4]]);
