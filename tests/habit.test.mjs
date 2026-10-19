// node tests/habit.test.mjs
import { compute } from '../src/habit.js';

const now = new Date(2026, 9, 19, 12); // lunes 19 oct 2026
const en = new Date(2026, 9, 1).getTime(); // activado el jueves 1 oct -> han pasado 3 lunes
let failed = 0;
const t = (name, input, check) => {
  const r = compute({ enabledAt: en, ...input }, now);
  const ok = check(r);
  if (!ok) failed++;
  console.log(ok ? 'OK  ' : 'FAIL', name, ok ? '' : JSON.stringify(r));
};

t('racha de 3 hasta ayer', { days: ['2026-10-16', '2026-10-17', '2026-10-18'] }, r => r.streak === 3 && !r.broken && !r.trainedToday);
t('racha de 4 contando hoy', { days: ['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19'] }, r => r.streak === 4 && r.trainedToday);
t('protectores: 1 + uno por lunes', {}, r => r.freezes === 4);
t('rota por 1 día', { days: ['2026-10-15', '2026-10-16', '2026-10-17'] }, r => r.streak === 0 && r.broken?.prevStreak === 3 && r.broken.needed === 1 && r.broken.canSave);
t('rota pero hoy ya entrenado', { days: ['2026-10-16', '2026-10-17', '2026-10-19'] }, r => r.streak === 1 && r.broken?.gap.join() === '2026-10-18');
t('salvada con protector', { days: ['2026-10-16', '2026-10-17', '2026-10-19'], frozen: ['2026-10-18'] }, r => r.streak === 4 && !r.broken && r.freezes === 3);
t('hueco mayor que los protectores', { days: ['2026-10-12', '2026-10-13'] }, r => r.broken?.needed === 5 && !r.broken.canSave);
t('ruptura descartada', { days: ['2026-10-16', '2026-10-17'], dismissed: '2026-10-17' }, r => !r.broken);
t('hueco anterior a activar el modo no cuenta', { enabledAt: new Date(2026, 9, 19).getTime(), days: ['2026-10-10'] }, r => !r.broken && r.freezes === 1);
t('calendario semanal', { days: ['2026-10-19'], frozen: ['2026-10-18'] }, r => r.week.map(w => w.state[0]).join('') === 'mmmmmfd');

process.exit(failed ? 1 : 0);
