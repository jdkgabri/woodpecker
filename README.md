# Woodpecker trainer

A PWA to train chess tactics with the Woodpecker Method: solve the same set of puzzles in
repeated, ever faster cycles. Live at <https://woodpecker-93e04.web.app/>.

## Features

- **The 1,128 puzzles of *The Woodpecker Method*** (Axel Smith & Hans Tikkanen), by level
  (1–222 easy, 223–984 intermediate, 985–1128 advanced) or any custom range.
- **Lichess puzzles** from two sources:
  - a **local collection** of ~450,000 puzzles from the Lichess database (~1,500 per theme and
    100-point rating band): any theme and rating range, instant and offline;
  - the **Lichess API with your account**: puzzles picked around your puzzle rating.
- **PGN import**: solutions with variations and comments; puzzles without moves are solved
  with Stockfish on the device; doubtful cases are reported before creating the set.
- **Timed cycles with pause** (button, `space`/`p`, or automatic when leaving the app),
  mistake review, per-cycle puzzle list and in-app **Stockfish analysis**.
- **Progress**: time/accuracy chart per cycle, performance by theme, most missed positions,
  activity map.
- **Optional habit mode**: daily streak, streak freezes, push/email reminders, XP, levels and
  achievements. Off by default.
- **Sync** across devices with Google sign-in (Firebase); works fully offline.
- **English and Spanish** (English is the default and the source language).
- Lichess-like look and sounds.

## Development

```sh
npm install
npm run dev       # local server
npm run build     # builds dist/ (static site)
```

Tests:

```sh
node tests/habit.test.mjs
node tests/pgn.test.mjs
node tests/progress.test.mjs
node scripts/i18n-keys.mjs          # every UI text has a Spanish translation
# server reminders (needs the Firestore emulator):
npx firebase-tools emulators:exec --only firestore --project demo-woodpecker "cd functions && node test.mjs"
```

Deployment: `npx firebase-tools deploy --only hosting` publishes the site to Firebase Hosting (the GitHub Pages workflow in `.github/workflows/deploy.yml` also publishes a copy on every push to `main`).
Firebase rules and functions are deployed with `npx firebase-tools deploy --only firestore:rules,functions`.

## Translations

UI texts are written in English in the code (`t('New set')`, `tn(n, '{n} puzzle', '{n} puzzles')`).
Spanish lives in `src/i18n-es.js`, keyed by the English text. A `|context` suffix in a key
(e.g. `'Easy|levels'`) is never displayed; it only separates texts that are equal in English but
not in Spanish.

## Data

- `public/woodpecker.json` is generated with `tools/solve.py` (Stockfish 17.1) from the book's PGN,
  which only contains the positions. Per puzzle: `{ n, fen, t }` with
  `t = [[moveUci, replyUci|null, subtree|null], ...]`; the first entry is the main line and the rest
  are accepted alternatives. Any mating move is always accepted.
- `public/lichess/` is generated with `tools/lichess-subset.py` from the
  [Lichess puzzle database](https://database.lichess.org/#puzzles) (CC0).

## Credits

- Analysis: Stockfish 17.1 compiled to WebAssembly ([stockfish.js](https://github.com/nmrugg/stockfish.js),
  lite single-thread build) in `public/stockfish/`. Stockfish is free software under GPLv3
  (`public/stockfish/COPYING.txt`).
- The look imitates the [Lichess](https://lichess.org) dark theme (without its logo or brand).
  Sounds: Lichess *standard* set (Enigmahack / lila, AGPLv3+) in `public/sound/`.
  *cburnett* pieces (Colin M.L. Burnett, GPLv2+) and brown board via
  [chessground](https://github.com/lichess-org/chessground).
