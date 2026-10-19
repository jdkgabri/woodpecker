// Stockfish 17.1 (WASM, lite single-threaded build) running in a Web Worker.
export class Engine {
  constructor() {
    this.worker = new Worker(import.meta.env.BASE_URL + 'stockfish/stockfish.js');
    this.listeners = new Set();
    this.worker.onmessage = e => this.listeners.forEach(f => f(String(e.data)));
    this.worker.onerror = e => console.error('Stockfish:', e.message);
    this.ready = this.waitFor(l => l === 'readyok');
    this.send('uci');
    this.send('setoption name Hash value 32');
    this.send('isready');
    this.gen = 0;
    this.idle = Promise.resolve(); // resolves when no search is running
  }

  on(f) { this.listeners.add(f); return () => this.listeners.delete(f); }
  send(cmd) { this.worker.postMessage(cmd); }
  waitFor(pred) {
    return new Promise(resolve => {
      const off = this.on(l => { if (pred(l)) { off(); resolve(); } });
    });
  }

  /**
   * Analyses up to depth 30 (or until stop) and calls onUpdate with the lines.
   * lines[k] = { multipv, depth, cp|mate (from white's point of view), pv: [uci] }
   */
  async analyse(fen, multipv, onUpdate) {
    const gen = ++this.gen;
    await this.ready;
    this.stop();
    await this.idle; // options can only be changed while the engine is idle
    if (gen !== this.gen) return;
    const whiteToMove = fen.split(' ')[1] === 'w';
    const lines = [];
    this.off?.();
    this.off = this.on(line => {
      if (gen !== this.gen || !line.startsWith('info ') || !line.includes(' pv ')) return;
      const t = line.split(' ');
      const get = k => t[t.indexOf(k) + 1];
      const k = +(get('multipv') || 1);
      const scoreType = get('score');
      let val = +t[t.indexOf('score') + 2];
      if (!whiteToMove) val = -val;
      lines[k - 1] = {
        multipv: k,
        depth: +get('depth'),
        cp: scoreType === 'cp' ? val : null,
        mate: scoreType === 'mate' ? val : null,
        pv: t.slice(t.indexOf('pv') + 1),
      };
      onUpdate(lines.filter(Boolean), +get('depth'));
    });
    this.send(`setoption name MultiPV value ${multipv}`);
    this.send(`position fen ${fen}`);
    this.idle = this.waitFor(l => l.startsWith('bestmove'));
    this.searching = true;
    this.idle.then(() => { this.searching = false; });
    this.send('go depth 30');
  }

  /**
   * Fixed-time search; returns the final lines with the score from the point of view
   * of the side to move: [{ move, cp|mate, pv }]
   */
  async search(fen, { multipv = 1, movetime = 1000 } = {}) {
    ++this.gen;
    this.off?.();
    await this.ready;
    this.stop();
    await this.idle;
    const lines = [];
    const off = this.on(line => {
      if (!line.startsWith('info ') || !line.includes(' pv ')) return;
      const t = line.split(' ');
      const get = k => t[t.indexOf(k) + 1];
      const k = +(get('multipv') || 1);
      const type = get('score');
      const val = +t[t.indexOf('score') + 2];
      const pv = t.slice(t.indexOf('pv') + 1);
      lines[k - 1] = { move: pv[0], cp: type === 'cp' ? val : null, mate: type === 'mate' ? val : null, pv };
    });
    this.send(`setoption name MultiPV value ${multipv}`);
    this.send(`position fen ${fen}`);
    this.idle = this.waitFor(l => l.startsWith('bestmove'));
    this.searching = true;
    this.send(`go movetime ${movetime}`);
    await this.idle;
    this.searching = false;
    off();
    return lines.filter(Boolean);
  }

  stop() { if (this.searching) this.send('stop'); }

  destroy() {
    this.gen++;
    this.off?.();
    this.worker.terminate();
  }
}
