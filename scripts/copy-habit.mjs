// The server function uses the same streak logic as the app
import { copyFileSync } from 'node:fs';
copyFileSync(new URL('../src/habit.js', import.meta.url), new URL('../functions/habit.js', import.meta.url));
