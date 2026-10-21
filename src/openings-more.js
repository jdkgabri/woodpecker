// More opening courses, built around a branching tree (lines with treeOnly: true only open the
// tree). Same format as openings-data.js; the trees are in public/openings/trees/ and their notes
// in public/openings/notes/.
const tree = (file, name, moves, summary) => ({ id: file, name, moves, treeOnly: true, tree: { file }, ...(summary ? { summary } : {}) });

export const MORE_OPENINGS = [
  // ---- king's gambit
  {
    id: 'kings-gambit', side: 'w', eco: 'C30–C39', puzzles: 'kings-gambit',
    name: { en: 'King\'s Gambit', es: 'Gambito de Rey' },
    summary: {
      en: '1.e4 e5 2.f4 — the romantic gambit: a pawn for a fast attack on the f-file.',
      es: '1.e4 e5 2.f4 — el gambito romántico: un peón a cambio de un ataque rápido por la columna f.',
    },
    intro: {
      en: [
        'With 2.f4 White offers a pawn to remove Black\'s e5-pawn, build a centre with d4 and open the f-file for the rook. It leads to sharp positions where both kings can come under fire.',
        'Black can accept with 2...exf4 (the main line), decline with 2...Bc5 or counter-gambit with 2...d5. White must be careful too: the e1–h4 diagonal is weakened and ...Qh4+ is a typical resource.',
      ],
      es: [
        'Con 2.f4 las blancas ofrecen un peón para eliminar el peón negro de e5, montar un centro con d4 y abrir la columna f para la torre. Lleva a posiciones agudas en las que ambos reyes pueden quedar bajo fuego.',
        'Las negras pueden aceptar con 2...exf4 (la línea principal), rehusar con 2...Ac5 o contragambitear con 2...d5. Las blancas también deben tener cuidado: la diagonal e1–h4 queda debilitada y ...Dh4+ es un recurso típico.',
      ],
    },
    structure: {
      en: 'After 2...exf4 White aims for pawns on e4 and d4 and tries to win back the f4-pawn; Black often holds it with ...g5. If the f-file opens, the rook on f1 and the bishop on c4 point at f7.',
      es: 'Tras 2...exf4 las blancas buscan peones en e4 y d4 e intentan recuperar el peón de f4; las negras suelen sostenerlo con ...g5. Si se abre la columna f, la torre de f1 y el alfil de c4 apuntan a f7.',
    },
    plans: {
      w: {
        en: ['Nf3 first to stop ...Qh4+.', 'Build the centre with d4 and develop with Bc4 and castling.', 'Undermine ...g5 with h4 and win back the f4-pawn.'],
        es: ['Primero Cf3 para evitar ...Dh4+.', 'Montar el centro con d4 y desarrollar con Ac4 y enroque.', 'Socavar ...g5 con h4 y recuperar el peón de f4.'],
      },
      b: {
        en: ['Hit back in the centre with ...d5.', 'Keep the pawn with ...g5 only if it is safe.', 'Use the weakened g1–a7 diagonal with ...Bc5.'],
        es: ['Contraatacar en el centro con ...d5.', 'Mantener el peón con ...g5 solo si es seguro.', 'Aprovechar la diagonal g1–a7 debilitada con ...Ac5.'],
      },
    },
    lines: [tree('kings-gambit', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 e5 f4')],
  },
  // ---- scotch
  {
    id: 'scotch', side: 'w', eco: 'C44–C45', puzzles: 'scotch',
    name: { en: 'Scotch Game', es: 'Apertura Escocesa' },
    summary: {
      en: '1.e4 e5 2.Nf3 Nc6 3.d4 — opens the centre at once; direct, active and easy to learn.',
      es: '1.e4 e5 2.Cf3 Cc6 3.d4 — abre el centro de inmediato; directa, activa y fácil de aprender.',
    },
    intro: {
      en: [
        'Instead of putting pressure on e5 slowly, White opens the centre with 3.d4. After 3...exd4 4.Nxd4 White has a free game, the e4-pawn against Black\'s d-pawn and quick development.',
        'Black usually answers 4...Nf6 (attacking e4) or 4...Bc5 (attacking the d4-knight). A common club mistake is to delay development; the Scotch punishes it with fast threats.',
      ],
      es: [
        'En lugar de presionar e5 poco a poco, las blancas abren el centro con 3.d4. Tras 3...exd4 4.Cxd4 tienen juego libre, el peón de e4 frente al peón d negro y un desarrollo rápido.',
        'Las negras suelen responder 4...Cf6 (atacando e4) o 4...Ac5 (atacando el caballo de d4). Un error típico en clubes es retrasar el desarrollo; la Escocesa lo castiga con amenazas rápidas.',
      ],
    },
    structure: {
      en: 'After the exchange on d4 White has a pawn on e4 and Black on d7 (or d6): White has more central space. In the Mieses line (Nxc6 bxc6, e5) Black gets doubled c-pawns but the bishop pair.',
      es: 'Tras el cambio en d4 las blancas tienen un peón en e4 y las negras en d7 (o d6): las blancas tienen más espacio central. En la línea Mieses (Cxc6 bxc6, e5) las negras tienen peones doblados en c pero la pareja de alfiles.',
    },
    plans: {
      w: {
        en: ['Develop quickly: Nc3, Bd3 or Bc4, castle.', 'Push e5 to kick the f6-knight when it is strong.', 'Use the open d-file and the d4/d5 squares.'],
        es: ['Desarrollar rápido: Cc3, Ad3 o Ac4, enroque.', 'Empujar e5 para echar al caballo de f6 cuando sea fuerte.', 'Aprovechar la columna d abierta y las casillas d4 y d5.'],
      },
      b: {
        en: ['Hit e4 with ...Nf6 and the d4-knight with ...Bc5.', 'Break with ...d5 to free the game.', 'Use the bishop pair after Nxc6.'],
        es: ['Atacar e4 con ...Cf6 y el caballo de d4 con ...Ac5.', 'Romper con ...d5 para liberar el juego.', 'Aprovechar la pareja de alfiles tras Cxc6.'],
      },
    },
    lines: [tree('scotch', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 e5 Nf3 Nc6 d4')],
  },
];
