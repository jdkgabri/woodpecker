// node tests/pgn-tree.test.mjs
import assert from 'node:assert/strict';
import { buildTree } from '../src/pgn-tree.js';

// a ";" inside a comment is text, not the start of a rest-of-line comment
const g = buildTree('1. e4 { Central; and flexible } e5 2. Nf3 ; a real line comment\n Nc6 *');
assert.equal(g.skipped, 0);
assert.equal(g.root.k[0].c, 'Central; and flexible');
let n = g.root, line = [];
while (n.k?.length) { n = n.k[0]; line.push(n.s); }
assert.deepEqual(line, ['e4', 'e5', 'Nf3', 'Nc6']);
console.log('pgn-tree ok');
