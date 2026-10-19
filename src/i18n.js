// Languages: English is the source language (the text in the code is the key) and
// ES provides the Spanish translation. A "|context" suffix in a key is never shown; it only
// separates texts that are equal in English but different in Spanish.
// t('Cycle {n}', { n: 3 }) -> 'Cycle 3' / 'Ciclo 3'
import { ES } from './i18n-es.js';

const SETTINGS_KEY = 'wp:settings:v1';
const DEFAULT_LANG = 'en';

export const LANGS = [['en', 'English'], ['es', 'Español'], ['auto', 'Automatic / Automático']];

export function langSetting() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').lang || DEFAULT_LANG; } catch { return DEFAULT_LANG; }
}

export function lang() {
  const s = langSetting();
  if (s === 'es' || s === 'en') return s;
  return (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
}

export const locale = () => (lang() === 'es' ? 'es-ES' : 'en-GB');

export function t(text, params = {}) {
  const out = lang() === 'es' ? (ES[text] ?? text.split('|')[0]) : text.split('|')[0];
  return out.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
}

// Simple plural: tn(n, '{n} day', '{n} days')
export const tn = (n, one, many, params = {}) => t(n === 1 ? one : many, { n, ...params });

export function applyDocumentLang() {
  document.documentElement.lang = lang();
}
