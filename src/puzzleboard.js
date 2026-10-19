import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { sound } from './sound.js';

const toColor = c => (c === 'w' ? 'white' : 'black');

function dests(chess) {
  const d = new Map();
  for (const m of chess.moves({ verbose: true })) {
    if (!d.has(m.from)) d.set(m.from, []);
    d.get(m.from).push(m.to);
  }
  return d;
}

/**
 * Tablero de puzle.
 * tree = [[uci, replyUci|null, subtree|null], ...]  (primera entrada = línea principal)
 * Cualquier jugada que dé mate se acepta siempre.
 */
export class PuzzleBoard {
  constructor(el, { coords = true, onEvent = () => {} } = {}) {
    this.el = el;
    this.onEvent = onEvent;
    this.cg = Chessground(el, {
      coordinates: coords,
      animation: { enabled: true, duration: 220 },
      highlight: { lastMove: true, check: true },
      premovable: { enabled: false },
      draggable: { showGhost: true },
      movable: { free: false, showDests: true, events: { after: (o, d) => this.userMove(o, d) } },
    });
    this.locked = true;
    this._resize = () => this.cg.redrawAll();
    window.addEventListener('resize', this._resize);
  }

  destroy() {
    window.removeEventListener('resize', this._resize);
    clearTimeout(this.timer);
    this.cg.destroy();
  }

  load({ fen, tree }) {
    clearTimeout(this.timer);
    this.chess = new Chess(fen);
    this.hero = this.chess.turn();
    this.node = tree || [];
    this.failed = false;
    this.done = false;
    this.pending = null;
    this.locked = false;
    this.cg.set({
      fen,
      orientation: toColor(this.hero),
      turnColor: toColor(this.hero),
      lastMove: undefined,
      check: this.chess.inCheck() ? toColor(this.hero) : false,
      movable: { color: toColor(this.hero), dests: dests(this.chess) },
    });
    this.cg.setAutoShapes([]);
  }

  setPaused(v) {
    this.paused = v;
    this.sync();
  }

  sync() {
    const canMove = !this.locked && !this.paused && !this.done && this.chess.turn() === this.hero;
    this.cg.set({
      fen: this.chess.fen(),
      turnColor: toColor(this.chess.turn()),
      check: this.chess.inCheck() ? toColor(this.chess.turn()) : false,
      movable: { color: canMove ? toColor(this.hero) : undefined, dests: canMove ? dests(this.chess) : new Map() },
    });
  }

  async userMove(orig, dest) {
    if (this.locked || this.paused || this.done) return this.sync();
    const piece = this.chess.get(orig);
    let promo = '';
    if (piece?.type === 'p' && (dest[1] === '8' || dest[1] === '1')) {
      promo = await this.askPromotion(dest);
      if (!promo) return this.sync();
    }
    const uci = orig + dest + promo;
    let mv;
    try { mv = this.chess.move({ from: orig, to: dest, promotion: promo || undefined }); }
    catch { return this.sync(); }
    this.playSound(mv);

    const match = this.node.find(e => e[0] === uci);
    if (match || this.chess.isCheckmate()) {
      this.cg.set({ lastMove: [orig, dest] });
      this.sync();
      if (!match || !match[1] || !match[2]) return this.finish();
      this.locked = true;
      this.pending = match;
      this.sync();
      this.timer = setTimeout(() => {
        this.pending = null;
        this.playUci(match[1]);
        this.node = match[2];
        this.locked = false;
        this.sync();
        this.onEvent('progress');
      }, 350);
      this.onEvent('good');
      return;
    }
    // jugada incorrecta
    this.failed = true;
    this.locked = true;
    this.sync();
    sound('error');
    this.onEvent('wrong', { san: mv.san, uci });
    this.timer = setTimeout(() => {
      this.chess.undo();
      this.cg.set({ lastMove: undefined });
      this.locked = false;
      this.sync();
    }, 550);
  }

  playUci(uci) {
    const mv = this.chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined });
    this.cg.move(uci.slice(0, 2), uci.slice(2, 4));
    this.cg.set({ lastMove: [uci.slice(0, 2), uci.slice(2, 4)] });
    this.playSound(mv);
    this.sync();
    return mv;
  }

  playSound(mv) {
    if (this.chess.isCheckmate()) sound('mate');
    else if (this.chess.inCheck()) sound('check');
    else sound(mv.captured ? 'capture' : 'move');
  }

  finish() {
    this.done = true;
    this.locked = true;
    this.sync();
    if (!this.failed) sound('success');
    this.onEvent('solved', { ok: !this.failed });
  }

  // Muestra la solución desde la posición actual (cuenta como fallo)
  showSolution() {
    if (this.done) return;
    this.failed = true;
    this.locked = true;
    clearTimeout(this.timer);
    // si estábamos esperando deshacer una jugada errónea
    if (this.pending) {
      // jugada correcta a la espera de la respuesta del rival
      const m = this.pending;
      this.pending = null;
      this.playUci(m[1]);
      this.node = m[2];
    } else if (this.chess.turn() !== this.hero) {
      // jugada errónea aún sin deshacer
      this.chess.undo();
      this.cg.set({ lastMove: undefined });
      this.sync();
    }
    const step = () => {
      const e = this.node[0];
      if (!e) return this.finish();
      this.playUci(e[0]);
      if (!e[1] || !e[2]) { this.timer = setTimeout(() => this.finish(), 300); return; }
      this.timer = setTimeout(() => {
        this.playUci(e[1]);
        this.node = e[2];
        this.timer = setTimeout(step, 650);
      }, 650);
    };
    this.timer = setTimeout(step, 250);
  }

  askPromotion(dest) {
    return new Promise(resolve => {
      const color = this.hero;
      const wrap = document.createElement('div');
      wrap.className = 'promo';
      const glyph = { q: '♛', r: '♜', b: '♝', n: '♞' };
      for (const p of ['q', 'n', 'r', 'b']) {
        const b = document.createElement('button');
        b.className = 'promo-btn ' + toColor(color);
        b.textContent = glyph[p];
        b.onclick = ev => { ev.stopPropagation(); wrap.remove(); resolve(p); };
        wrap.appendChild(b);
      }
      wrap.onclick = () => { wrap.remove(); resolve(''); };
      this.el.parentElement.appendChild(wrap);
    });
  }
}
