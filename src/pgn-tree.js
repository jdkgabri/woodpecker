// PGN with variations and comments → move tree, shared by the app (PGNs users import) and
// scripts/build-course.mjs. Node: { s: san, u: uci, k: [children], c: comment, a: arrows, q: squares,
// n: glyphs, j/t: marked as important move / trick (the "_J"/"_T" codes some course authors use) }.
import { Chess } from 'chess.js';

const NAG = { 1: '!', 2: '?', 3: '!!', 4: '??', 5: '!?', 6: '?!', 10: '=', 13: '∞', 14: '⩲', 15: '⩱', 16: '±', 17: '∓', 18: '+−', 19: '−+', 32: '⟳', 36: '→', 40: '↑', 132: '⇆' };
const HEADER = /^\[\w+\s+"/;

// Splits a file into games: a new game starts where headers follow movetext, or where movetext
// follows a game that already ended with its result (games without headers)
const RESULT_END = /(^|\s)(1-0|0-1|1\/2-1\/2|\*)\s*$/;
export function splitGames(text) {
  const games = [];
  let cur = null;
  for (const block of text.replace(/^﻿/, '').replace(/\r/g, '').split(/\n\s*\n/)) {
    const b = block.trim();
    if (!b) continue;
    const header = HEADER.test(b);
    if (!cur || (header && cur.moves) || (!header && cur.ended)) { cur = { text: '', moves: false, ended: false }; games.push(cur); }
    cur.text += '\n\n' + b;
    if (!header) { cur.moves = true; cur.ended = RESULT_END.test(b.replace(/\{[^}]*\}/g, '')); }
  }
  return games.map(g => g.text.trim()).filter(Boolean);
}

// Comment text without lichess commands; arrows and squares kept apart
function readComment(raw, node) {
  let txt = raw;
  txt = txt.replace(/\[%cal ([^\]]*)\]/g, (_, v) => { (node.a ||= []).push(...v.split(',').map(s => s.trim()).filter(Boolean)); return ''; });
  txt = txt.replace(/\[%csl ([^\]]*)\]/g, (_, v) => { (node.q ||= []).push(...v.split(',').map(s => s.trim()).filter(Boolean)); return ''; });
  txt = txt.replace(/\[%[a-z]+[^\]]*\]/g, '');
  if (/(^|\s)_J(\s|$)/.test(txt)) node.j = 1;
  if (/(^|\s)_T(\s|$)/.test(txt)) node.t = 1;
  txt = txt.replace(/(^|\s)_[JT](?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
  if (txt) node.c = node.c ? node.c + ' ' + txt : txt;
}

// Removes empty child lists so the data stays small
function compact(n) {
  for (const ch of n.k) compact(ch);
  if (!n.k.length) delete n.k;
  return n;
}

// Move tree of a game: variations hang from the parent of the move they replace. A move that is not
// legal skips the rest of its line (counted in `skipped`) instead of rejecting the whole game.
export function buildTree(src) {
  const headers = {};
  const body = src.replace(/\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]/g, (_, k, v) => { headers[k] = v.replace(/\\(.)/g, '$1'); return ''; });
  let fen = headers.FEN || new Chess().fen();
  try { new Chess(fen); } catch { throw new Error(`Invalid FEN in "${headers.Event || '?'}"`); }
  const root = { k: [] };
  const tokens = body.replace(/;[^\n]*/g, '').match(/\{[^}]*\}|\(|\)|\$\d+|[^\s(){}]+/g) || [];
  let cur = root, prev = null, dead = 0, skipped = 0;   // dead: depth of the line being skipped (0 = none)
  const stack = [];
  const fenOf = new Map([[root, fen]]);
  const parentOf = new Map();
  for (const tok of tokens) {
    if (tok === '(') {
      stack.push({ cur, prev, dead });
      if (!dead) { cur = parentOf.get(prev) || root; prev = null; }
      continue;
    }
    if (tok === ')') { if (stack.length) ({ cur, prev, dead } = stack.pop()); continue; }
    if (dead) continue;
    if (tok[0] === '{') { readComment(tok.slice(1, -1), prev || root); continue; }
    if (tok[0] === '$') { const g = NAG[+tok.slice(1)]; if (g && prev) prev.n = (prev.n || '') + g; continue; }
    if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(tok) || /^\d+\.+$/.test(tok)) continue;
    let glyph = '';
    const sanTok = tok.replace(/^\d+\.+/, '').replace(/[!?]+$/, m => { glyph = m; return ''; })
      .replace(/^0-0-0/, 'O-O-O').replace(/^0-0/, 'O-O');
    if (!sanTok) continue;
    const c = new Chess(fenOf.get(cur));
    let mv = null;
    try { mv = c.move(sanTok); } catch { mv = null; }
    if (!mv) { dead = 1; skipped++; continue; }
    let node = cur.k.find(x => x.s === mv.san);   // the same move in the main line and a variation is one node
    if (!node) {
      node = { s: mv.san, u: mv.from + mv.to + (mv.promotion || ''), k: [] };
      cur.k.push(node);
      fenOf.set(node, c.fen());
      parentOf.set(node, cur);
    }
    if (glyph) node.n = (node.n || '') + glyph;
    prev = node; cur = node;
  }
  return { headers, fen, root: compact(root), skipped };
}
