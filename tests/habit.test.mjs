// node tests/habit.test.mjs
import { compute } from '../src/habit.js';

const now = new Date(2026, 9, 19, 12); // Monday 19 Oct 2026
const enabledAt = new Date(2026, 9, 1).getTime(); // enabled on Thursday 1 Oct -> 3 Mondays have passed
let failed = 0;
const check = (name, input, assert) => {
  const r = compute({ enabledAt, ...input }, now);
  const ok = assert(r);
  if (!ok) failed++;
  console.log(ok ? 'OK  ' : 'FAIL', name, ok ? '' : JSON.stringify(r));
};

check('3-day streak up to yesterday', { days: ['2026-10-16', '2026-10-17', '2026-10-18'] }, r => r.streak === 3 && !r.broken && !r.trainedToday);
check('4-day streak including today', { days: ['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19'] }, r => r.streak === 4 && r.trainedToday);
check('freezes: 1 + one per Monday', {}, r => r.freezes === 4);
check('broken by 1 day', { days: ['2026-10-15', '2026-10-16', '2026-10-17'] }, r => r.streak === 0 && r.broken?.prevStreak === 3 && r.broken.needed === 1 && r.broken.canSave);
check('broken but already trained today', { days: ['2026-10-16', '2026-10-17', '2026-10-19'] }, r => r.streak === 1 && r.broken?.gap.join() === '2026-10-18');
check('saved with a freeze', { days: ['2026-10-16', '2026-10-17', '2026-10-19'], frozen: ['2026-10-18'] }, r => r.streak === 4 && !r.broken && r.freezes === 3);
check('gap larger than the freezes', { days: ['2026-10-12', '2026-10-13'] }, r => r.broken?.needed === 5 && !r.broken.canSave);
check('dismissed break', { days: ['2026-10-16', '2026-10-17'], dismissed: '2026-10-17' }, r => !r.broken);
check('gap before enabling the mode does not count', { enabledAt: new Date(2026, 9, 19).getTime(), days: ['2026-10-10'] }, r => !r.broken && r.freezes === 1);
check('weekly calendar', { days: ['2026-10-19'], frozen: ['2026-10-18'] }, r => r.week.map(w => w.state[0]).join('') === 'mmmmmfd');

process.exit(failed ? 1 : 0);
