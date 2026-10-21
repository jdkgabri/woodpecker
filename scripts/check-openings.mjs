// Checks the opening courses: every move legal, notes only on existing plies, both languages present.
// Writes the final position of every line to a JSON file for an engine check (optional argument).
// node scripts/check-openings.mjs [positions.json]
import { writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { OPENINGS } from '../src/openings-data.js';

let errors = 0;
const positions = [];
const fail = (where, msg) => { errors++; console.log('FAIL', where, msg); };
const both = (where, obj) => { if (!obj?.en || !obj?.es) fail(where, 'missing en/es'); };

for (const o of OPENINGS) {
  both(o.id + '.name', o.name); both(o.id + '.summary', o.summary); both(o.id + '.structure', o.structure);
  if (o.intro.en.length !== o.intro.es.length) fail(o.id, 'intro paragraphs differ');
  for (const side of ['w', 'b']) if (o.plans[side] && o.plans[side].en.length !== o.plans[side].es.length) fail(o.id, 'plans differ ' + side);
  for (const line of [...o.lines, ...(o.traps || [])]) {
    const where = `${o.id}/${line.id}`;
    both(where + '.name', line.name);
    const chess = new Chess();
    const sans = line.moves.split(' ');
    const ucis = [];
    for (const [i, san] of sans.entries()) {
      try { const m = chess.move(san); ucis.push(m.from + m.to + (m.promotion || '')); }
      catch { fail(where, `illegal move ${i + 1}: ${san}`); break; }
    }
    for (const [ply, note] of Object.entries(line.notes || {})) {
      if (+ply < 1 || +ply > sans.length) fail(where, `note on ply ${ply} beyond ${sans.length}`);
      both(`${where}@${ply}`, note);
    }
    positions.push({ id: where, trap: !!line.trap, side: o.side, moves: ucis, fen: chess.fen() });
  }
}
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(positions, null, 1));
console.log(`${positions.length} lines checked, ${errors} errors`);
process.exit(errors ? 1 : 0);
