// Builds public/courses/<id>.json from a course folder: one subfolder per chapter ("N. Name"),
// each with Estudio.pgn, Entrenamiento.pgn, Jugadas Importantes.pgn and Truquitos.pgn (any may be missing),
// and optionally Ampliacion.pgn: extra, deeper lines of the same repertoire. In positions the course covers,
// only the course's own moves are kept for the course side: the extended lines just go deeper.
// Usage: node scripts/build-course.mjs <folder> <id> "<name>" <w|b> "<author>"
import fs from 'node:fs';
import path from 'node:path';
import { Chess } from 'chess.js';
import { splitGames, buildTree } from '../src/pgn-tree.js';

const [dir, id, name, side, author] = process.argv.slice(2);
if (!dir || !id || !name || !/^[wb]$/.test(side || '')) {
  console.error('Usage: node scripts/build-course.mjs <folder> <id> "<name>" <w|b> "<author>"');
  process.exit(1);
}

const cleanTitle = s => s.replace(/\d️?⃣/gu, '').replace(/^[^\p{L}\d]*?(?:Italiana Enigmática \(PGN\):\s*)?/u, '').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{20E3}]/gu, '').replace(/^\s*[*#]?\s*/, '').trim();

const KINDS = [['study', /^(\d+\.\s*)?Estudio/i], ['train', /^(\d+\.\s*)?Entrenamiento/i], ['important', /Importantes/i], ['tricks', /Truquitos/i], ['extra', /Ampliaci/i]];
const chapters = [];
const dirs = fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory() && /^\d+[.\s]/.test(d.name))
  .sort((a, b) => parseInt(a.name) - parseInt(b.name));
for (const d of dirs) {
  const chName = d.name.replace(/^\d+[.\s]+/, '').trim();
  const ch = { id: String(parseInt(d.name)), name: chName };
  for (const f of fs.readdirSync(path.join(dir, d.name)).filter(f => f.toLowerCase().endsWith('.pgn'))) {
    const kind = KINDS.find(([, re]) => re.test(f))?.[0];
    if (!kind) { console.warn('skipped', d.name, f); continue; }
    const games = splitGames(fs.readFileSync(path.join(dir, d.name, f), 'utf8'));
    for (const g of games) {
      const { headers, fen, root, skipped } = buildTree(g);
      if (skipped) console.warn(`${d.name}/${f}: ${skipped} illegal move(s) skipped in "${headers.Event}"`);
      // chapters by other authors (e.g. the academy's own account) are left out
      if (/lichess\.org\/@\/Chess-Enigma/i.test(headers.Annotator || '')) { console.warn('excluded (other author):', headers.Event); continue; }
      if (!root.k?.length) continue;
      (ch[kind] ||= []).push({ title: cleanTitle(headers.Event || ''), fen, root });
    }
  }
  chapters.push(ch);
}

// Extended lines must not contradict the course: drop their moves for the course side in positions
// where the course plays something else
const ownMoves = new Map();
const positionsOf = (game, fn) => {
  const walk = (node, fen) => { fn(node, fen); for (const k of node.k || []) { const c = new Chess(fen); c.move(k.s); walk(k, c.fen()); } };
  walk(game.root, game.fen);
};
const posKey = f => f.split(' ').slice(0, 4).join(' ');
for (const ch of chapters) for (const kind of ['study', 'train', 'important', 'tricks']) for (const g of ch[kind] || [])
  positionsOf(g, (node, fen) => {
    if (fen.split(' ')[1] !== side || !node.k?.length) return;
    const set = ownMoves.get(posKey(fen)) || new Set();
    node.k.forEach(k => set.add(k.s));
    ownMoves.set(posKey(fen), set);
  });
let dropped = 0;
for (const ch of chapters) for (const g of ch.extra || [])
  positionsOf(g, (node, fen) => {
    const course = ownMoves.get(posKey(fen));
    if (fen.split(' ')[1] !== side || !course || !node.k) return;
    // where the course gives its moves, only those count (an extra 3.Bb5 would teach another opening);
    // the extended lines add what comes after them
    const keep = node.k.filter(k => course.has(k.s));
    dropped += node.k.length - keep.length;
    if (keep.length) node.k = keep; else delete node.k;
  });
if (dropped) console.log(`extended lines: ${dropped} move(s) that contradict the course dropped`);

const course = { id, name, side, author: author || '', chapters };
const outDir = path.join('public', 'courses');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(course));
const index = fs.existsSync(path.join(outDir, 'index.json')) ? JSON.parse(fs.readFileSync(path.join(outDir, 'index.json'), 'utf8')) : [];
const entry = { id, name, side, author: course.author, chapters: chapters.length };
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify([...index.filter(c => c.id !== id), entry], null, 1));
const count = k => chapters.reduce((a, c) => a + (c[k]?.length || 0), 0);
console.log(`${id}: ${chapters.length} chapters · study ${count('study')} · train ${count('train')} · important ${count('important')} · tricks ${count('tricks')} · extra ${count('extra')} · ${fs.statSync(path.join(outDir, `${id}.json`)).size} bytes`);
