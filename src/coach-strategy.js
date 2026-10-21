// Strategic ideas for the game review coach: what a good move achieves (plans, piece activity,
// pawn structure, king safety…) and what a weak move gives away. Pure functions, no engine:
// the engine decides which move is best, these functions explain why in plain language.
import { Chess } from 'chess.js';
import { t } from './i18n.js';

const VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PIECE = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const pieceName = type => t(PIECE[type] + '|piece');
const THE = { p: 'the pawn', n: 'the knight', b: 'the bishop', r: 'the rook', q: 'the queen', k: 'the king' };
const thePiece = type => t(THE[type]);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const fileIdx = sq => sq.charCodeAt(0) - 97;
const rankOf = sq => +sq[1];
const relRank = (sq, color) => (color === 'w' ? rankOf(sq) : 9 - rankOf(sq));
const isDark = sq => (fileIdx(sq) + rankOf(sq)) % 2 === 0;
const other = c => (c === 'w' ? 'b' : 'w');

// ---------- helpers ----------
function nullMove(fen) {
  const c = new Chess(fen);
  if (c.inCheck()) return null;
  const p = fen.split(' ');
  p[1] = other(p[1]);
  p[3] = '-';
  try { return new Chess(p.join(' ')); } catch { return null; }
}
const mobility = (chess, square) => { try { return chess.moves({ square, verbose: true }).length; } catch { return 0; } };
function pieces(chess, color, types = 'pnbrqk') {
  const out = [];
  for (const row of chess.board()) for (const p of row) if (p && p.color === color && types.includes(p.type)) out.push(p);
  return out;
}
function material(chess, side) {
  let m = 0;
  for (const row of chess.board()) for (const sq of row) if (sq) m += (sq.color === side ? 1 : -1) * VALUES[sq.type];
  return m;
}
const pawnFiles = (chess, color) => pieces(chess, color, 'p').map(p => fileIdx(p.square));
function isolatedPawns(chess, color) {
  const files = pawnFiles(chess, color);
  return pieces(chess, color, 'p').filter(p => !files.includes(fileIdx(p.square) - 1) && !files.includes(fileIdx(p.square) + 1)).map(p => p.square);
}
function doubledFiles(chess, color) {
  const count = {};
  for (const f of pawnFiles(chess, color)) count[f] = (count[f] || 0) + 1;
  return Object.keys(count).filter(f => count[f] > 1).map(Number);
}
function isPassed(chess, sq, color) {
  const f = fileIdx(sq), r = rankOf(sq);
  return !pieces(chess, other(color), 'p').some(p => Math.abs(fileIdx(p.square) - f) <= 1 && (color === 'w' ? rankOf(p.square) > r : rankOf(p.square) < r));
}
function pawnCanAttack(chess, sq, enemy) {
  return pieces(chess, enemy, 'p').some(p => Math.abs(fileIdx(p.square) - fileIdx(sq)) === 1 &&
    (enemy === 'b' ? rankOf(p.square) > rankOf(sq) : rankOf(p.square) < rankOf(sq)));
}
const queensOff = chess => !pieces(chess, 'w', 'q').length && !pieces(chess, 'b', 'q').length;
const fullMoves = fen => +fen.split(' ')[5];
// A bishop is "bad" when many of its own pawns stand on its colour (they block it).
const ownPawnsOnColour = (chess, color, dark) => pieces(chess, color, 'p').filter(p => isDark(p.square) === dark).length;
const kingZoneFiles = sq => [fileIdx(sq) - 1, fileIdx(sq), fileIdx(sq) + 1];

function idea(kind, score, text) { return { kind, score, text }; }

/**
 * What a move achieves strategically, best first: [{ kind, score, text }].
 * `fen` is the position before the move (side to move plays `uci`).
 */
export function strategicIdeas(fen, uci) {
  const before = new Chess(fen);
  const me = before.turn(), enemy = other(me);
  const after = new Chess(fen);
  let m;
  try { m = after.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }); } catch { return []; }
  if (after.isCheckmate()) return [];
  const out = [];
  const enemyBefore = nullMove(fen);   // enemy to move before our move
  const meAgain = nullMove(after.fen()); // us to move again after it
  const opening = fullMoves(fen) <= 12, endgame = queensOff(after) || pieces(after, me, 'nbrq').length <= 2;

  // --- restricting enemy pieces (the knight "umbrella", pawns taking squares from knights…)
  if (enemyBefore && !after.inCheck()) {
    for (const p of pieces(after, enemy, 'nbrq')) {
      const was = mobility(enemyBefore, p.square), now = mobility(after, p.square);
      if (was < 3 || now > 1 || was - now < 2) continue;
      const by = m.piece === 'p' ? t('The pawn') : t('Your {piece}', { piece: pieceName(m.piece) });
      out.push(idea('restrict', 2 + was - now + VALUES[p.type] / 3,
        t('{by} takes squares away from {piece} on {sq}: it goes from {a} moves to {b}. A piece with no squares is almost out of the game.', { by, piece: thePiece(p.type), sq: p.square, a: was, b: now })));
    }
  }

  // --- outposts
  if ((m.piece === 'n' || m.piece === 'b') && relRank(m.to, me) >= 4 && relRank(m.to, me) <= 6) {
    const pawnGuard = after.attackers(m.to, me).some(s => after.get(s).type === 'p');
    if (pawnGuard && !pawnCanAttack(after, m.to, enemy)) {
      out.push(idea('outpost', m.piece === 'n' ? 6 : 4,
        t('{piece} lands on an outpost on {sq}: a pawn protects it and no enemy pawn can ever chase it away. From there it controls key squares for the rest of the game.', { piece: cap(thePiece(m.piece)), sq: m.to })));
    }
  }

  // --- knight from the rim to the centre
  if (m.piece === 'n' && [0, 7].includes(fileIdx(m.from)) && ![0, 7].includes(fileIdx(m.to))) {
    out.push(idea('centralise', 3, t('The knight comes back from the edge of the board towards the centre, where it controls twice as many squares.')));
  }

  // --- opening diagonals for bishops / files for rooks with a pawn move
  if (m.piece === 'p' && meAgain) {
    for (const p of pieces(before, me, 'b')) {
      const was = mobility(before, p.square), now = mobility(meAgain, p.square);
      if (now - was >= 3) out.push(idea('diagonal', 2 + now - was,
        t('Moving the pawn opens the diagonal for your bishop on {sq}: it goes from {a} to {b} squares. Active bishops are worth much more.', { sq: p.square, a: was, b: now })));
    }
  }

  // --- rooks: open and half-open files, doubling, the 6th/7th rank
  if (m.piece === 'r') {
    const f = fileIdx(m.to);
    const mine = pawnFiles(after, me).includes(f), theirs = pawnFiles(after, enemy).includes(f);
    const fromFileOpen = !pawnFiles(before, me).includes(fileIdx(m.from));
    if (!mine && !theirs && !fromFileOpen) out.push(idea('open-file', 4, t('The rook takes the open file: rooks belong on files without pawns, where they can reach the enemy camp.')));
    else if (!mine && theirs && !fromFileOpen) out.push(idea('half-open', 3, t('The rook goes to the half-open file and puts pressure on the enemy pawn in front of it.')));
    if (pieces(after, me, 'rq').some(p => p.square !== m.to && fileIdx(p.square) === f && p.type === 'r')) {
      out.push(idea('double', 3, t('Doubling the rooks on the same file multiplies the pressure: together they are much stronger.')));
    }
    if (relRank(m.to, me) >= 6) {
      const tied = pieces(after, enemy, 'p').filter(p => rankOf(p.square) === rankOf(m.to) && after.attackers(p.square, me).includes(m.to))
        .map(p => ({ pawn: p.square, defenders: after.attackers(p.square, enemy).map(s => after.get(s)) }))
        .find(x => x.defenders.length && x.defenders.every(d => d.type !== 'p'));
      if (tied) out.push(idea('tie', 5, t('The rook attacks the pawn on {sq}. Only a piece can defend it, so that piece ({piece}) becomes tied to the pawn and loses its freedom.', { sq: tied.pawn, piece: thePiece(tied.defenders[0].type) })));
      else if (relRank(m.to, me) === 7) out.push(idea('seventh', 3, t('A rook on the seventh rank attacks the pawns from the side and cuts off the enemy king.')));
    }
  }

  // --- batteries against the king (queen and bishop on the same diagonal, or queen and rook on a file)
  if ('qb'.includes(m.piece) && !opening) {
    const king = pieces(after, enemy, 'k')[0]?.square;
    if (king) {
      const zone = kingZoneFiles(king);
      const partner = pieces(after, me, m.piece === 'q' ? 'b' : 'q')[0];
      const attacksZone = sq => after.attackers(sq, me).includes(m.to);
      const hits = [-1, 0, 1].flatMap(dr => zone.map(fi => String.fromCharCode(97 + fi) + (rankOf(king) + dr))).filter(sq => /^[a-h][1-8]$/.test(sq) && attacksZone(sq));
      if (partner && hits.length >= 2) {
        const sameDiag = Math.abs(fileIdx(partner.square) - fileIdx(m.to)) === Math.abs(rankOf(partner.square) - rankOf(m.to));
        if (sameDiag) out.push(idea('battery', 4, t('Queen and bishop line up on the same diagonal towards the king: a battery like this creates mating threats.')));
      }
    }
  }

  // --- pawn play: breaks, passed pawns
  if (m.piece === 'p') {
    const levers = after.attackers(m.to, enemy).length === 0 && pieces(after, enemy, 'p').some(p => after.attackers(p.square, me).includes(m.to));
    if (levers && !opening) out.push(idea('break', 3, t('A pawn break: the pawn attacks the enemy chain to open lines for your pieces.')));
    if (isPassed(after, m.to, me)) {
      const wasPassed = m.from && isPassed(before, m.from, me);
      if (!wasPassed) out.push(idea('passed', 4, t('This creates a passed pawn: no enemy pawn can stop it, and it will be a constant worry for your opponent.')));
      else if (relRank(m.to, me) >= 5) out.push(idea('push-passed', 4, t('Passed pawns must be pushed: every step forward ties down more enemy pieces.')));
    }
  }

  // --- trades: a bad bishop, simplifying when ahead, damaging the enemy structure
  if (m.captured) {
    const matNow = material(before, me);
    if (m.piece === 'b' && ownPawnsOnColour(before, me, isDark(m.from)) >= 4) out.push(idea('bad-bishop', 3, t('You trade your "bad" bishop, the one blocked by your own pawns on its colour.')));
    if (matNow >= 2 && m.captured !== 'p' && VALUES[m.captured] >= VALUES[m.piece] - 0.5) out.push(idea('simplify', 3, t('When you are ahead in material, trading pieces brings you closer to a winning endgame.')));
    const isoBefore = isolatedPawns(before, enemy).length, isoAfter = isolatedPawns(after, enemy).length;
    const dblBefore = doubledFiles(before, enemy).length, dblAfter = doubledFiles(after, enemy).length;
    if (dblAfter > dblBefore) out.push(idea('structure', 3, t('The exchange leaves your opponent with doubled pawns, a long-term weakness.')));
    else if (isoAfter > isoBefore) out.push(idea('structure', 3, t('The exchange leaves your opponent with an isolated pawn, a long-term target.')));
  }

  // --- development, castling, king activity
  if (m.isKingsideCastle() || m.isQueensideCastle()) out.push(idea('castle', 4, t('Castling gets the king to safety and connects the rooks.')));
  else if (opening && (m.piece === 'n' || m.piece === 'b') && relRank(m.from, me) === 1) out.push(idea('develop', 2, t('It develops a piece that was still at home: in the opening, every move should bring a new piece into play.')));
  if (m.piece === 'k' && endgame && relRank(m.to, me) > relRank(m.from, me) && [2, 3, 4, 5].includes(fileIdx(m.to))) {
    out.push(idea('king-activity', 4, t('In the endgame the king is a strong piece: bring it towards the centre and the action.')));
  }
  if (meAgain && 'nbrq'.includes(m.piece)) {
    const was = mobility(before, m.from), now = mobility(meAgain, m.to);
    if (now - was >= 5) out.push(idea('activity', 2 + (now - was) / 3, t('{piece} goes from {a} to {b} squares: it was one of your least active pieces and now it plays.', { piece: cap(thePiece(m.piece)), a: was, b: now })));
  }
  return out.sort((a, b) => b.score - a.score);
}

/**
 * Strategic problems a move creates for the side that plays it: [{ kind, text }].
 */
export function strategicDamage(fen, uci) {
  const before = new Chess(fen);
  const me = before.turn();
  const after = new Chess(fen);
  let m;
  try { m = after.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }); } catch { return []; }
  const out = [];
  const opening = fullMoves(fen) <= 12;

  if (m.piece === 'p' || m.captured) {
    if (isolatedPawns(after, me).length > isolatedPawns(before, me).length) out.push({ kind: 'isolated', text: t('Your move leaves you with an isolated pawn: no pawn can protect it, so it needs pieces to defend it.') });
    if (doubledFiles(after, me).length > doubledFiles(before, me).length) out.push({ kind: 'doubled', text: t('Your move doubles your pawns: they cannot protect each other.') });
  }
  if (m.piece === 'p') {
    const king = pieces(after, me, 'k')[0]?.square;
    const castled = king && relRank(king, me) === 1 && (fileIdx(king) >= 6 || fileIdx(king) <= 2);
    if (castled && kingZoneFiles(king).includes(fileIdx(m.from)) && relRank(m.from, me) === 2 && !opening) {
      out.push({ kind: 'king-shelter', text: t('This pawn move weakens the shelter in front of your castled king: squares around it can no longer be covered by pawns.') });
    }
    for (const b of pieces(after, me, 'b')) {
      if (isDark(b.square) === isDark(m.to) && ownPawnsOnColour(after, me, isDark(b.square)) >= 5 && ownPawnsOnColour(before, me, isDark(b.square)) < 5) {
        out.push({ kind: 'bad-bishop', text: t('With this move most of your pawns stand on the same colour as your bishop on {sq}, which becomes a "bad" bishop.', { sq: b.square }) });
        break;
      }
    }
  }
  if (m.piece === 'n' && [0, 7].includes(fileIdx(m.to)) && ![0, 7].includes(fileIdx(m.from))) {
    out.push({ kind: 'rim', text: t('"A knight on the rim is dim": on the edge it controls only half the squares.') });
  }
  if (m.piece === 'k' && !m.isKingsideCastle() && !m.isQueensideCastle() && before.getCastlingRights(me).k + before.getCastlingRights(me).q > 0 && !before.inCheck() && !queensOff(before)) {
    out.push({ kind: 'castling-lost', text: t('Moving the king loses the right to castle, and it stays in the middle of the board.') });
  }
  if (m.piece === 'q' && opening && fullMoves(fen) <= 8 && pieces(before, me, 'nb').filter(p => relRank(p.square, me) === 1).length >= 3) {
    out.push({ kind: 'early-queen', text: t('Bringing the queen out this early lets your opponent develop with tempo by attacking it.') });
  }
  return out;
}
