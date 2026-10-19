// La función del servidor usa la misma lógica de racha que la app
import { copyFileSync } from 'node:fs';
copyFileSync(new URL('../src/habit.js', import.meta.url), new URL('../functions/habit.js', import.meta.url));
