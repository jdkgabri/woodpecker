// Lista los textos traducibles del código y comprueba que todos tienen traducción al inglés.
// node scripts/i18n-keys.mjs [--missing]
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../src/', import.meta.url);
const keys = new Set();
for (const f of readdirSync(dir).filter(f => f.endsWith('.js'))) {
  const src = readFileSync(new URL(f, dir), 'utf8');
  for (const m of src.matchAll(/\bt\('([^']*)'/g)) keys.add(m[1]);
  for (const m of src.matchAll(/\btn\([^,]+,\s*'([^']*)',\s*'([^']*)'/g)) { keys.add(m[1]); keys.add(m[2]); }
}
// etiquetas que se traducen de forma dinámica, con t(variable)
const { WP_LEVELS_LABELS, THEME_LABELS, DIFF_LABELS } = await import('./i18n-dynamic.mjs');
[...WP_LEVELS_LABELS, ...THEME_LABELS, ...DIFF_LABELS].forEach(k => keys.add(k));

const { EN } = await import('../src/i18n-en.js');
const missing = [...keys].filter(k => !(k in EN));
const unused = Object.keys(EN).filter(k => !keys.has(k));
if (process.argv.includes('--missing')) console.log(missing.join('\n'));
else console.log(`${keys.size} textos · ${missing.length} sin traducir · ${unused.length} traducciones sin uso`);
if (unused.length) console.log('Sin uso:', unused);
process.exit(missing.length ? 1 : 0);
