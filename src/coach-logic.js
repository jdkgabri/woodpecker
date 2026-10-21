// Game review "coach": the logic behind it (no DOM). Picks the key moments of a game and turns
// engine lines into plain-language explanations, questions and hints.
// Scores are centipawns from the point of view of the side to move; mates are { mate: n }.
import { Chess } from 'chess.js';
import { t } from './i18n.js';
import { strategicIdeas, strategicDamage } from './coach-strategy.js';

export { strategicIdeas, strategicDamage };

export const VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PIECE = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
export const pieceName = type => t(PIECE[type] + '|piece');
// With the article, so languages with gendered nouns read well: "the rook" → "la torre".
const THE = { p: 'the pawn', n: 'the knight', b: 'the bishop', r: 'the rook', q: 'the queen', k: 'the king' };
const A = { p: 'a pawn', n: 'a knight', b: 'a bishop', r: 'a rook', q: 'a queen', k: 'a king' };
export const thePiece = type => t(THE[type]);
export const aPiece = type => t(A[type]);
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- scores ----------
// Winning chances (0–100) for the side to move, like Lichess.
export function winPct(line) {
  if (!line) return 50;
  if (line.mate != null) return line.mate > 0 ? 100 : 0;
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * line.cp)) - 1);
}

// Lichess-like classification from the drop in winning chances (percentage points).
export function classify(loss) {
  if (loss >= 15) return 'blunder';
  if (loss >= 10) return 'mistake';
  if (loss >= 5) return 'inaccuracy';
  return null;
}

// ---------- game input ----------
// Accepts a Lichess URL ("https://lichess.org/AbCdEfGh/black", ".../AbCdEfGhIjKl") or a bare id.
export function parseGameId(input) {
  const s = String(input || '').trim();
  const m = s.match(/lichess\.org\/(?:embed\/(?:game\/)?)?([a-zA-Z0-9]{8})(?:[a-zA-Z0-9]{4})?/) || s.match(/^([a-zA-Z0-9]{8})(?:[a-zA-Z0-9]{4})?$/);
  return m ? m[1] : null;
}

// FENs before every ply and the moves in UCI and SAN: { fens: [fen0..fenN], moves: [{san, uci, color}] }
export function replay(sans) {
  const c = new Chess();
  const fens = [c.fen()], moves = [];
  for (const s of sans) {
    const m = c.move(s);
    moves.push({ san: m.san, uci: m.from + m.to + (m.promotion || ''), color: m.color, captured: m.captured, piece: m.piece });
    fens.push(c.fen());
  }
  return { fens, moves };
}

// ---------- board facts ----------
export function material(chess, side) {
  let m = 0;
  for (const row of chess.board()) for (const sq of row) if (sq) m += (sq.color === side ? 1 : -1) * VALUES[sq.type];
  return m;
}

// Pieces of `side` that can be won: attacked and undefended, or attacked by a cheaper piece.
export function hangingPieces(chess, side) {
  const enemy = side === 'w' ? 'b' : 'w';
  const out = [];
  for (const row of chess.board()) for (const sq of row) {
    if (!sq || sq.color !== side || sq.type === 'k') continue;
    const attackers = chess.attackers(sq.square, enemy);
    if (!attackers.length) continue;
    const defenders = chess.attackers(sq.square, side);
    const cheapest = Math.min(...attackers.map(a => VALUES[chess.get(a).type] || 0));
    if (!defenders.length || cheapest < VALUES[sq.type]) out.push({ square: sq.square, type: sq.type });
  }
  return out.sort((a, b) => VALUES[b.type] - VALUES[a.type]);
}

// The position with the other side to move (to ask "what would the opponent do now?").
// Returns null if the side to move is in check (a null move is not possible).
export function nullMoveFen(fen) {
  const c = new Chess(fen);
  if (c.inCheck()) return null;
  const p = fen.split(' ');
  p[1] = p[1] === 'w' ? 'b' : 'w';
  p[3] = '-';
  try { new Chess(p.join(' ')); } catch { return null; }
  return p.join(' ');
}

// ---------- describing moves ----------
// "takes the bishop on c5 with check", "castles", "pushes the pawn to d4"…
export function describeMove(fen, uci) {
  const c = new Chess(fen);
  const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  const parts = [];
  if (m.isKingsideCastle() || m.isQueensideCastle()) parts.push(t('castles and puts the king in safety'));
  else if (m.captured) parts.push(t('takes {piece} on {sq}', { piece: thePiece(m.captured), sq: m.to }));
  else if (m.promotion) parts.push(t('promotes to {piece}', { piece: aPiece(m.promotion) }));
  else if (m.piece === 'p') parts.push(t('pushes the pawn to {sq}', { sq: m.to }));
  else parts.push(t('moves {piece} to {sq}', { piece: thePiece(m.piece), sq: m.to }));
  if (c.isCheckmate()) { parts.push(t('— checkmate!')); return parts.join(' '); }
  if (c.inCheck()) parts.push(t('with check'));
  const pin = pinBy(c, m.to);
  const targets = attackedBy(c, m.to).filter(x => x.type !== 'p' || !c.attackers(x.square, x.color).length);
  if (pin) parts.push(t('and pins {piece} on {sq} to {behind}', { piece: thePiece(pin.type), sq: pin.square, behind: thePiece(pin.behind) }));
  else if (targets.length >= 2 || (c.inCheck() && targets.length)) {
    parts.push(t('— a double attack on {a} on {sa} and {b} on {sb}', c.inCheck()
      ? { a: thePiece('k'), sa: kingSquare(c, c.turn()), b: thePiece(targets[0].type), sb: targets[0].square }
      : { a: thePiece(targets[0].type), sa: targets[0].square, b: thePiece(targets[1].type), sb: targets[1].square }));
  } else if (targets.length) parts.push(t('and attacks {piece} on {sq}', { piece: thePiece(targets[0].type), sq: targets[0].square }));
  return parts.join(' ');
}

const kingSquare = (chess, color) => chess.board().flat().find(p => p && p.type === 'k' && p.color === color)?.square;

// A pin by the sliding piece on `square`: the first enemy piece on a line, with their king or a more
// valuable piece behind it. Returns { square, type, behind } or null.
function pinBy(chess, square) {
  const me = chess.get(square);
  if (!me || !'brq'.includes(me.type)) return null;
  const dirs = { b: [[1, 1], [1, -1], [-1, 1], [-1, -1]], r: [[1, 0], [-1, 0], [0, 1], [0, -1]] };
  const all = me.type === 'q' ? [...dirs.b, ...dirs.r] : dirs[me.type];
  const f0 = square.charCodeAt(0) - 97, r0 = +square[1];
  for (const [df, dr] of all) {
    let first = null;
    for (let k = 1; k < 8; k++) {
      const f = f0 + df * k, r = r0 + dr * k;
      if (f < 0 || f > 7 || r < 1 || r > 8) break;
      const sq = String.fromCharCode(97 + f) + r;
      const p = chess.get(sq);
      if (!p) continue;
      if (p.color === me.color) break;
      if (!first) { first = { square: sq, type: p.type }; continue; }
      if (first.type !== 'k' && (p.type === 'k' || (first.type !== 'p' && VALUES[p.type] >= 5 && VALUES[p.type] > VALUES[first.type]))) return { ...first, behind: p.type };
      break;
    }
  }
  return null;
}

// Enemy pieces attacked by the piece on `square` (worth more than it, or undefended), best first.
function attackedBy(chess, square) {
  const me = chess.get(square);
  if (!me) return [];
  const out = [];
  for (const row of chess.board()) for (const sq of row) {
    if (!sq || sq.color === me.color || sq.type === 'k') continue;
    if (!chess.attackers(sq.square, me.color).includes(square)) continue;
    const defended = chess.attackers(sq.square, sq.color).length > 0;
    if (!defended || VALUES[sq.type] > VALUES[me.type]) out.push({ square: sq.square, type: sq.type, color: sq.color });
  }
  return out.sort((a, b) => VALUES[b.type] - VALUES[a.type]);
}

// What a line achieves for the side to move at `fen`: { kind: 'mate'|'material'|'none', gain, text }.
// `cp` (engine score for that side) confirms that the material gain is real and not a half-finished
// exchange at the end of the line.
export function lineOutcome(fen, pv, mate = null, plies = 8, cp = null) {
  const c = new Chess(fen);
  const side = c.turn();
  const start = material(c, side);
  let first = null;
  for (const u of pv.slice(0, plies)) {
    try { const m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); first ??= m; } catch { break; }
  }
  if ((mate != null && mate > 0) || (c.isCheckmate() && c.turn() !== side)) {
    return { kind: 'mate', gain: 100, text: mate != null && mate > 1 ? t('it leads to mate in {n}', { n: mate }) : t('it is checkmate') };
  }
  // count the material at the last two "rest points" (after the opponent's replies) and keep the smaller
  const c2 = new Chess(fen);
  const checkpoints = [];
  pv.slice(0, plies).forEach((u, i) => {
    try { c2.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); } catch { return; }
    if (i % 2 === 1) checkpoints.push(material(c2, side) - start);
  });
  let gain = checkpoints.length >= 2 ? Math.min(...checkpoints.slice(-2)) : (checkpoints[0] ?? material(c, side) - start);
  if (cp != null && gain >= 1 && cp < gain * 60) gain = Math.max(0, Math.floor(cp / 90));
  if (gain >= 1) return { kind: 'material', gain, text: tradeText(fen, pv.slice(0, plies), side) || winsText(gain) };
  return { kind: 'none', gain, text: '' };
}

// "it wins the queen for a knight": the most valuable piece taken and the most valuable one given up
function tradeText(fen, pv, side) {
  const c = new Chess(fen);
  const won = [], lost = [];
  for (const u of pv) {
    let m;
    try { m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); } catch { break; }
    if (m.captured) (m.color === side ? won : lost).push(m.captured);
  }
  const top = arr => arr.sort((a, b) => VALUES[b] - VALUES[a])[0];
  const w = top(won), l = top(lost);
  if (!w || w === 'p') return '';
  if (!l) return t('it wins {piece}', { piece: thePiece(w) });
  if (VALUES[w] > VALUES[l]) return t('it wins {piece} for {other}', { piece: thePiece(w), other: aPiece(l) });
  return '';
}

function winsText(gain) {
  if (gain >= 9) return t('it wins the queen');
  if (gain >= 5) return t('it wins a rook');
  if (gain >= 3) return t('it wins a piece');
  if (gain === 2) return t('it wins the exchange or two pawns');
  return t('it wins a pawn');
}

// A short positional reason for a quiet best move.
export function quietReason(fen, uci) {
  const idea = strategicIdeas(fen, uci)[0];
  if (idea) return idea.text;
  const c = new Chess(fen);
  const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  const backRank = m.color === 'w' ? '1' : '8';
  if (m.isKingsideCastle() || m.isQueensideCastle()) return t('Castling gets the king to safety and connects the rooks.');
  if (m.piece === 'p' && ['d4', 'e4', 'd5', 'e5', 'c4', 'c5', 'f4', 'f5'].includes(m.to)) return t('The pawn fights for the centre and gives the pieces more room.');
  if ((m.piece === 'n' || m.piece === 'b') && m.from[1] === backRank) return t('It develops a piece that was still at home.');
  if (m.piece === 'r') {
    const file = m.to[0];
    const pawnsOnFile = c.board().flat().filter(s => s && s.type === 'p' && s.square[0] === file).length;
    if (pawnsOnFile === 0) return t('The rook takes the open file.');
    if (pawnsOnFile === 1) return t('The rook goes to the half-open file.');
  }
  if (hangingPieces(new Chess(fen), m.color).some(h => h.square === m.from)) return t('It saves a piece that was in danger.');
  if (c.inCheck()) return t('The check gains time.');
  if (m.captured) return t('The exchange removes an active enemy piece.');
  if (m.piece === 'p') return t('The pawn gains space and takes squares away from the enemy pieces.');
  if (m.piece === 'k') return t('The king steps away from future checks and pins.');
  return t('It improves {piece}: compare where it stands before and after, and what it controls now.', { piece: thePiece(m.piece) });
}

// ---------- choosing the moments ----------
/**
 * evals[i] = engine line ({cp|mate, pv}) for fens[i], from the side to move.
 * Returns the user's moments: [{ ply, kind, loss, best, played }], at most `max`, in game order.
 */
export function pickMoments({ fens, moves, evals, color, max = 6, maxStrategy = 2 }) {
  const out = [];
  for (let i = 0; i < moves.length; i++) {
    if (moves[i].color !== color || !evals[i] || !evals[i + 1]) continue;
    const before = winPct(evals[i]);
    const after = 100 - winPct(evals[i + 1]);
    const loss = before - after;
    // already decided either way: not instructive
    if (before > 97 && after > 90) continue;
    if (before < 5) continue;
    const kind = classify(loss);
    if (!kind) continue;
    const best = evals[i].pv?.[0];
    if (!best || best === moves[i].uci) continue;
    // did the opponent just blunder? then the user missed a chance
    const prevGood = i > 0 && evals[i - 1] ? 100 - winPct(evals[i - 1]) : 50;
    const missed = before >= 75 && prevGood <= 60;
    out.push({ ply: i, kind: missed ? 'missed' : kind, loss: Math.round(loss), best, played: moves[i].uci });
  }
  const rank = m => m.loss + (m.kind === 'missed' ? 10 : 0);
  const picked = out.sort((a, b) => rank(b) - rank(a)).slice(0, max);
  // strategic chances: the best move had a clear plan that the user's move did not (at most `maxStrategy`)
  const strategic = [];
  for (let i = 0; i < moves.length && strategic.length < maxStrategy; i++) {
    if (moves[i].color !== color || !evals[i]?.pv?.[0] || !evals[i + 1] || picked.some(m => m.ply === i)) continue;
    const best = evals[i].pv[0];
    if (best === moves[i].uci) continue;
    const loss = winPct(evals[i]) - (100 - winPct(evals[i + 1]));
    if (loss < 3 || winPct(evals[i]) > 90 || winPct(evals[i]) < 10) continue;
    const idea = strategicIdeas(fens[i], best)[0];
    if (!idea || idea.score < 4) continue;
    if (strategicIdeas(fens[i], moves[i].uci).some(x => x.kind === idea.kind)) continue;
    strategic.push({ ply: i, kind: 'strategy', loss: Math.round(loss), best, played: moves[i].uci, idea: idea.kind });
  }
  return [...picked, ...strategic].sort((a, b) => a.ply - b.ply);
}

// The lesson behind a moment, from what the best line and the refutation show.
// best: lineOutcome of the best move; refute: lineOutcome of the opponent's reply to the game move.
export function lessonFor(kind, { best, refute, hangingBefore, threat }) {
  if (kind === 'book') return 'book';
  if (kind === 'strategy') return 'strategy';
  if (threat && threat.kind !== 'none') return 'threat';
  if (refute && refute.kind === 'mate') return 'mate-danger';
  if (refute && refute.kind === 'material') return hangingBefore ? 'hanging' : 'tactic-allowed';
  if (best && best.kind !== 'none') return 'tactic-missed';
  return 'positional';
}

export const LESSONS = {
  'threat': { title: 'Check what your opponent threatens', tip: 'After every opponent move, ask: what does it attack? What does it want to do next?' },
  'mate-danger': { title: 'King safety', tip: 'Before moving, look at the checks your opponent will have after your move.' },
  'hanging': { title: 'Loose pieces', tip: 'Before moving, look for your undefended pieces and the ones attacked by cheaper pieces.' },
  'tactic-allowed': { title: 'Blunder check', tip: "Before you move, imagine the position after your move and look at all your opponent's checks, captures and threats." },
  'tactic-missed': { title: 'Forcing moves first', tip: 'When you have time, look at every check, capture and threat you have. That is where tactics hide.' },
  'positional': { title: 'Improve your worst piece', tip: 'When there is nothing forcing, find your least active piece and improve it, or play in the centre.' },
  'strategy': { title: 'A strategic plan', tip: 'In quiet positions, look for plans: restrict enemy pieces, find outposts, open lines for your bishops and rooks, create passed pawns, and tie your opponent to weak pawns.' },
  'book': { title: 'Your repertoire', tip: 'Review this line in your opening tree so you play it automatically next time.' },
};

// The first question the coach asks, before the user moves.
export function questionFor(lesson, { color }) {
  const side = color === 'w' ? t('White') : t('Black');
  switch (lesson) {
    case 'threat': return t('Your opponent has just made a threat. What is it? Find it first, then choose your move.');
    case 'mate-danger': return t('Careful: your king could get into trouble. Look at your opponent\'s possible checks before choosing a move.');
    case 'hanging': return t('One of your pieces is in danger. Which one? Then find the best move for {side}.', { side });
    case 'tactic-allowed': return t('In the game you played a move that allowed a tactic. Imagine your opponent\'s replies before choosing. What would you play?');
    case 'tactic-missed': return t('There is a strong move here. Look at every check, capture and threat. What do you find?');
    case 'positional': return t('No tactics here. Which of your pieces is doing least, and how can you improve it? Play the move you like.');
    case 'strategy': return t('No tactics here, but there is a good plan. Can you restrict an enemy piece, find an outpost or open a line for your pieces?');
    case 'book': return t('Here you left your repertoire. Do you remember the move from your opening tree?');
    default: return t('What would you play here?');
  }
}
