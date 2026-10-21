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
];
