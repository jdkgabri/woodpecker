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

// game review coach: lesson titles and tips, moment kinds, piece names
const coach = read('coach-logic.js');
const lessons = coach.slice(coach.indexOf('export const LESSONS'), coach.indexOf('};', coach.indexOf('export const LESSONS')));
export const COACH_LESSONS = [...lessons.matchAll(new RegExp('(?:title|tip): ' + q, 'g'))].map(pick);
const coachView = read('coach.js');
const kinds = coachView.slice(coachView.indexOf('const KIND_LABEL'), coachView.indexOf('};', coachView.indexOf('const KIND_LABEL')));
export const COACH_KINDS = [...kinds.matchAll(new RegExp(String.raw`\w+: ` + q, 'g'))].map(pick);
export const PIECE_NAMES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'].map(p => p + '|piece');
export const PIECE_ARTICLES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'].flatMap(p => ['the ' + p, 'a ' + p]);
