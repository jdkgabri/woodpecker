// Lógica de la racha (funciones puras, sin acceso a almacenamiento).
// Un día cuenta si se ha hecho al menos un ejercicio de un ciclo (days) o se ha cubierto
// con un protector de racha (frozen). Fechas como 'YYYY-MM-DD' en hora local.

export const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseDay = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };

export const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 250, 300, 365, 500, 730, 1000];

function mondayOf(d) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

// Lunes transcurridos desde que se activó el modo hábito
export function weeksSince(enabledAt, now) {
  const ms = mondayOf(now) - mondayOf(new Date(enabledAt));
  return Math.max(0, Math.round(ms / (7 * 86400000)));
}

export function compute({ days = [], frozen = [], enabledAt, dismissed = null }, now = new Date()) {
  const done = new Set(days);
  const froz = new Set(frozen);
  const covered = k => done.has(k) || froz.has(k);
  const today = dayKey(now);
  const yesterday = addDays(today, -1);

  const streakEndingAt = k => { let n = 0; while (covered(k)) { n++; k = addDays(k, -1); } return n; };
  const trainedToday = done.has(today);
  const streak = covered(today) ? streakEndingAt(today) : streakEndingAt(yesterday);

  const freezes = Math.max(0, 1 + weeksSince(enabledAt || now, now) - frozen.length);

  // ¿Se ha roto la racha? Hueco de días sin cubrir justo antes de hoy, tras una racha.
  let broken = null;
  if (!covered(yesterday)) {
    const gap = [];
    let k = yesterday;
    const enabledDay = dayKey(new Date(enabledAt || now));
    while (!covered(k) && gap.length < 60 && k >= enabledDay) { gap.push(k); k = addDays(k, -1); }
    const prevStreak = covered(k) ? streakEndingAt(k) : 0;
    if (prevStreak > 0 && dismissed !== k) {
      broken = { lastDay: k, prevStreak, gap: gap.reverse(), needed: gap.length, canSave: gap.length <= freezes };
    }
  }

  // Últimos 7 días para el calendario
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const k = addDays(today, -i);
    week.push({ day: k, state: done.has(k) ? 'done' : froz.has(k) ? 'frozen' : k === today ? 'today' : 'miss' });
  }

  const nextMilestone = MILESTONES.find(m => m > streak) || null;
  return { today, trainedToday, streak, freezes, broken, week, nextMilestone };
}
