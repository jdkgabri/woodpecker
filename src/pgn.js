// Reading puzzle collections in PGN.
// Supports tags, {..} and ; comments, (..) variations, NAGs ($n) and !, ?, !? annotations, etc.
import { Chess } from 'chess.js';

const NAG = { '!': 1, '?': 2, '!!': 3, '??': 4, '!?': 5, '?!': 6 };
const BAD_NAGS = new Set([2, 4, 6]); // mistake / blunder / dubious

// Splits the text into games: [{ headers, movetext }]
export function splitGames(text) {
  const games = [];
  let cur = null, inMoves = false;
  for (const raw of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const line = raw.trim();
    const isHeader = /^\[\w+\s+"(?:[^"\\]|\\.)*"\]$/.test(line);
    if (isHeader) {
      if (!cur || inMoves) { cur = { headers: {}, movetext: '' }; games.push(cur); inMoves = false; }
      const m = line.match(/^\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]$/);
      cur.headers[m[1]] = m[2].replace(/\\(.)/g, '$1');
    } else if (line) {
      if (!cur) { cur = { headers: {}, movetext: '' }; games.push(cur); }
      cur.movetext += raw + '\n';
      inMoves = true;
    }
  }
  return games;
}

// Turns the movetext into a tree: [{ san, nags, comment, variations: [[...]] }]
export function parseMovetext(text) {
  const tokens = text.match(/\{[^}]*\}|;[^\n]*|\(|\)|\$\d+|\d+\.(?:\.\.)?|\.\.\.|1-0|0-1|1\/2-1\/2|\*|[^\s(){};$]+/g) || [];
  const root = [];
  const stack = [root];
  let line = root;
  for (const tok of tokens) {
    if (tok[0] === '{' || tok[0] === ';') {
      const c = tok.replace(/^[{;]|}$/g, '').replace(/\[%[^\]]*\]/g, '').trim();
      if (!c) continue;
      const last = line[line.length - 1];
      if (last) last.comment = (last.comment ? last.comment + ' ' : '') + c;
      else line.preComment = (line.preComment ? line.preComment + ' ' : '') + c;
    } else if (tok === '(') {
      const last = line[line.length - 1];
      if (!last) continue;
      const v = [];
      last.variations.push(v);
      stack.push(v);
      line = v;
    } else if (tok === ')') {
      if (stack.length > 1) { stack.pop(); line = stack[stack.length - 1]; }
    } else if (tok[0] === '$') {
      const last = line[line.length - 1];
      if (last) last.nags.push(+tok.slice(1));
    } else if (/^\d+\.(\.\.)?$|^\.\.\.$|^(1-0|0-1|1\/2-1\/2|\*)$/.test(tok)) {
      continue;
    } else {
      const m = tok.match(/^(.*?)([!?]{1,2})?$/);
      const san = m[1].replace(/^\d+\.+/, '').replace(/0-0-0/g, 'O-O-O').replace(/0-0/g, 'O-O');
      if (!san) {
        const last = line[line.length - 1];
        if (last && m[2]) last.nags.push(NAG[m[2]]);
        continue;
      }
      line.push({ san, nags: m[2] ? [NAG[m[2]]] : [], comment: '', variations: [] });
    }
  }
  return root;
}

const uciOf = mv => mv.from + mv.to + (mv.promotion || '');
const cleanNotes = s => s.replace(/\s+/g, ' ').trim().slice(0, 600);

/**
 * Interprets a game as a puzzle.
 * opponentFirst: 'auto' | 'yes' | 'no'
 * Returns { ok, kind: 'solution'|'nosolution'|'error', fen, tree, label, notes, flags: [], reason }
 */
export function interpretGame(game, opponentFirst = 'auto') {
  const h = game.headers;
  const label = ['Event', 'White', 'Black'].map(k => h[k]).filter(v => v && v !== '?' && !/^\d+\.?\?*$/.test(v)).join(' · ').slice(0, 60);
  const moves = parseMovetext(game.movetext || '');
  const flags = [];
  if (!h.FEN) {
    if (moves.length) return { kind: 'error', reason: 'nofen' }; // a full game, not a puzzle
    return { kind: 'error', reason: 'empty' };
  }
  let chess;
  try { chess = new Chess(h.FEN); } catch { return { kind: 'error', reason: 'badfen' }; }
  if (!moves.length) return { kind: 'nosolution', fen: chess.fen(), label };

  // validate the main line
  const probe = new Chess(chess.fen());
  for (const node of moves) {
    try { node.mv = probe.move(node.san); } catch { return { kind: 'error', reason: 'illegal', detail: node.san }; }
  }
  let skip = 0;
  if (opponentFirst === 'yes') skip = 1;
  else if (opponentFirst === 'auto' && moves.length >= 2 && moves.length % 2 === 0) { skip = 1; flags.push('opponentFirst'); }
  if (skip && moves.length < 2) return { kind: 'error', reason: 'short' };

  const start = new Chess(chess.fen());
  for (let i = 0; i < skip; i++) start.move(moves[i].san);
  const line = moves.slice(skip);
  const tree = buildTree(start.fen(), line);
  if (!tree) return { kind: 'error', reason: 'illegal' };
  const notes = cleanNotes([moves.preComment, ...moves.map(n => n.comment)].filter(Boolean).join(' '));
  return { kind: 'solution', fen: start.fen(), tree, label, notes, flags };
}

// App tree from a main line that starts with the solver's move
function buildTree(fen, line) {
  const chess = new Chess(fen);
  const build = i => {
    const node = line[i];
    if (!node) return null;
    let mv;
    try { mv = chess.move(node.san); } catch { return undefined; }
    const entry = [uciOf(mv), null, null];
    const reply = line[i + 1];
    if (reply && line[i + 2]) {
      let rmv;
      try { rmv = chess.move(reply.san); } catch { chess.undo(); return undefined; }
      const sub = build(i + 2);
      if (sub === undefined) return undefined;
      entry[1] = uciOf(rmv);
      entry[2] = sub;
      chess.undo();
    }
    chess.undo();
    // variations on the solver's move: alternative solutions, except those marked ? / ?? / ?!
    const alts = [];
    for (const v of node.variations) {
      const first = v[0];
      if (!first || first.nags.some(n => BAD_NAGS.has(n))) continue;
      try {
        const amv = chess.move(first.san);
        chess.undo();
        const u = uciOf(amv);
        if (u !== entry[0] && !alts.some(a => a[0] === u)) alts.push([u, null, null]);
      } catch { /* illegal variation: ignored */ }
    }
    return [entry, ...alts];
  };
  return build(0);
}

// Summary of a file: [{ index, ...interpretation }]
export function analysePgn(text, opponentFirst = 'auto') {
  return splitGames(text).map((g, i) => ({ index: i + 1, ...interpretGame(g, opponentFirst) }));
}
