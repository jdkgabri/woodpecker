// Lists the translatable texts in the code and checks that all of them have a Spanish translation.
// node scripts/i18n-keys.mjs [--missing]
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../src/', import.meta.url);
const keys = new Set();
const str = String.raw`'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"`;
const unq = m => (m[1] ?? m[2]).replace(/\\(['"])/g, '$1');
for (const f of readdirSync(dir).filter(f => f.endsWith('.js') && !f.startsWith('i18n-'))) {
  const src = readFileSync(new URL(f, dir), 'utf8');
  for (const m of src.matchAll(new RegExp(String.raw`\bt\((?:` + str + ')', 'g'))) keys.add(unq(m));
  const tn = new RegExp(String.raw`\btn\([^,]+,\s*(?:` + str + String.raw`),\s*(?:` + str + ')', 'g');
  for (const m of src.matchAll(tn)) { keys.add(m[1] ?? m[2]); keys.add((m[3] ?? m[4]).replace(/\\(['"])/g, '$1')); }
}
// labels translated dynamically, with t(variable)
const dyn = await import('./i18n-dynamic.mjs');
Object.values(dyn).flat().forEach(k => keys.add(k));

const { ES } = await import('../src/i18n-es.js');
const missing = [...keys].filter(k => !(k in ES));
const unused = Object.keys(ES).filter(k => !keys.has(k));
if (process.argv.includes('--missing')) console.log(missing.join('\n'));
else console.log(`${keys.size} texts · ${missing.length} untranslated · ${unused.length} unused translations`);
if (unused.length) console.log('Unused:', unused);
process.exit(missing.length ? 1 : 0);
