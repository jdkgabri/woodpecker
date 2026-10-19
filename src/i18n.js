// Idiomas: el texto en español es la clave; EN aporta la traducción al inglés.
// t('Ciclo {n}', { n: 3 }) -> 'Ciclo 3' / 'Cycle 3'
import { EN } from './i18n-en.js';

const SETTINGS_KEY = 'wp:settings:v1';

export const LANGS = [['auto', 'Automático / Automatic'], ['es', 'Español'], ['en', 'English']];

export function langSetting() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').lang || 'auto'; } catch { return 'auto'; }
}

export function lang() {
  const s = langSetting();
  if (s === 'es' || s === 'en') return s;
  return (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
}

export const locale = () => (lang() === 'es' ? 'es-ES' : 'en-GB');

export function t(text, params = {}) {
  const out = lang() === 'es' ? text : (EN[text] ?? text);
  return out.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
}

// Plural sencillo: tn(n, '{n} día', '{n} días')
export const tn = (n, one, many, params = {}) => t(n === 1 ? one : many, { n, ...params });

export function applyDocumentLang() {
  document.documentElement.lang = lang();
}
