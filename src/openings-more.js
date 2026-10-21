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
  // ---- ruy
  {
    id: 'ruy-lopez', side: 'w', eco: 'C60–C99', puzzles: 'ruy-lopez',
    name: { en: 'Ruy Lopez (Spanish Game)', es: 'Apertura Española (Ruy López)' },
    summary: {
      en: '1.e4 e5 2.Nf3 Nc6 3.Bb5 — slow, lasting pressure on e5 and one of the richest openings in chess.',
      es: '1.e4 e5 2.Cf3 Cc6 3.Ab5 — presión lenta y duradera sobre e5; una de las aperturas más ricas del ajedrez.',
    },
    intro: {
      en: [
        'With 3.Bb5 White attacks the knight that defends e5. There is no immediate threat (after Bxc6 and Nxe5 Black wins the pawn back with ...Qd4), but the pressure stays for the whole game and Black has to keep an eye on the centre.',
        'Most club players answer 3...a6 (Morphy Defence), 3...Nf6 (Berlin) or 3...Bc5. White usually castles, plays Re1, c3 and d4 and builds a big centre; the bishop retreats to a4 and b3, where it aims at f7.',
      ],
      es: [
        'Con 3.Ab5 las blancas atacan el caballo que defiende e5. No hay amenaza inmediata (tras Axc6 y Cxe5 las negras recuperan el peón con ...Dd4), pero la presión dura toda la partida y las negras deben vigilar el centro.',
        'La mayoría de jugadores de club responden 3...a6 (Defensa Morphy), 3...Cf6 (Berlinesa) o 3...Ac5. Las blancas suelen enrocar, jugar Te1, c3 y d4 y montar un gran centro; el alfil se retira a a4 y b3, desde donde apunta a f7.',
      ],
    },
    structure: {
      en: 'The typical structure is e4–d4 (supported by c3) against e5–d6. If Black keeps e5, White gains space with d5 and attacks on the kingside; if Black gives up the centre with ...exd4, White gets free piece play.',
      es: 'La estructura típica es e4–d4 (apoyado por c3) contra e5–d6. Si las negras mantienen e5, las blancas ganan espacio con d5 y atacan en el flanco de rey; si las negras ceden el centro con ...exd4, las blancas consiguen juego libre de piezas.',
    },
    plans: {
      w: {
        en: ['Castle, Re1, c3 and d4 to build the ideal centre.', 'Keep the bishop on the a2–g8 diagonal (b3, later c2) aiming at the black king.', 'The knight goes Nbd2–f1–g3 towards the kingside.'],
        es: ['Enrocar, Te1, c3 y d4 para montar el centro ideal.', 'Mantener el alfil en la diagonal a2–g8 (b3, más tarde c2) apuntando al rey negro.', 'El caballo va Cbd2–f1–g3 hacia el flanco de rey.'],
      },
      b: {
        en: ['Hold e5 with ...d6 or counterattack with ...Nf6 and ...d5.', 'Gain queenside space with ...a6 and ...b5, kicking the bishop.', 'In the Berlin, trade queens and defend a solid endgame.'],
        es: ['Sostener e5 con ...d6 o contraatacar con ...Cf6 y ...d5.', 'Ganar espacio en el flanco de dama con ...a6 y ...b5, echando al alfil.', 'En la Berlinesa, cambiar damas y defender un final sólido.'],
      },
    },
    lines: [tree('ruy', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 e5 Nf3 Nc6 Bb5')],
  },
  // ---- london
  {
    id: 'london', side: 'w', eco: 'D02, A46, A48', puzzles: 'london',
    name: { en: 'London System', es: 'Sistema Londres' },
    summary: {
      en: '1.d4 and Bf4 — the same solid setup against almost everything: Bf4, e3, Nf3, c3, Bd3, Nbd2.',
      es: '1.d4 y Af4 — la misma estructura sólida contra casi todo: Af4, e3, Cf3, c3, Ad3, Cbd2.',
    },
    intro: {
      en: [
        'The London is a system rather than a sequence of moves: White develops the dark-squared bishop to f4 before playing e3, then completes a solid pyramid of pawns on c3, d4 and e3.',
        'It is popular because there is little theory to learn, but you still need to know the critical replies: an early ...c5 with ...Qb6 hitting b2, and setups where Black plays ...Bd6 to trade bishops.',
      ],
      es: [
        'La Londres es un sistema más que una secuencia de jugadas: las blancas desarrollan el alfil de casillas negras a f4 antes de jugar e3 y luego completan una pirámide sólida de peones en c3, d4 y e3.',
        'Es popular porque hay poca teoría, pero aun así hay que conocer las respuestas críticas: ...c5 temprano con ...Db6 atacando b2, y los planes en los que las negras juegan ...Ad6 para cambiar alfiles.',
      ],
    },
    structure: {
      en: 'Pawns on c3–d4–e3 against Black\'s d5 (or a King\'s Indian setup). The e5 square is White\'s outpost: a knight there, backed by f4 or the bishop, supports a kingside attack.',
      es: 'Peones en c3–d4–e3 contra d5 negro (o una estructura India de Rey). La casilla e5 es el puesto avanzado blanco: un caballo allí, apoyado por f4 o el alfil, sostiene un ataque en el flanco de rey.',
    },
    plans: {
      w: {
        en: ['Bf4, e3, Nf3, c3, Bd3, Nbd2 and castling.', 'Ne5 followed by f4 or Qf3 for a kingside attack.', 'Keep h3 ready so the f4-bishop can retreat to h2 if attacked by ...Nh5.'],
        es: ['Af4, e3, Cf3, c3, Ad3, Cbd2 y enroque.', 'Ce5 seguido de f4 o Df3 para atacar en el flanco de rey.', 'Tener h3 preparado para que el alfil de f4 se retire a h2 si lo ataca ...Ch5.'],
      },
      b: {
        en: ['...c5 and ...Qb6 against b2.', '...Bd6 to trade the strong f4-bishop.', 'Fianchetto with ...g6 and break with ...e5.'],
        es: ['...c5 y ...Db6 contra b2.', '...Ad6 para cambiar el fuerte alfil de f4.', 'Fianchetto con ...g6 y ruptura ...e5.'],
      },
    },
    lines: [tree('london', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'd4')],
  },
  // ---- morra
  {
    id: 'morra', side: 'w', vs: 'e4', eco: 'B21', puzzles: 'morra',
    name: { en: 'Smith-Morra Gambit', es: 'Gambito Smith-Morra' },
    summary: {
      en: '1.e4 c5 2.d4 cxd4 3.c3 — a pawn for fast development and open lines against the Sicilian.',
      es: '1.e4 c5 2.d4 cxd4 3.c3 — un peón a cambio de desarrollo rápido y líneas abiertas contra la Siciliana.',
    },
    intro: {
      en: [
        'In the Morra White sacrifices a pawn (sometimes two) to develop quickly: Nc3, Nf3, Bc4, castling, Qe2 and Rd1, with pressure on the open c- and d-files.',
        'It is very dangerous at club level because natural moves can lose quickly. Black can accept and defend accurately, or decline with 3...d3, 3...Nf6 or 3...d5.',
      ],
      es: [
        'En el Morra las blancas sacrifican un peón (a veces dos) para desarrollarse rápido: Cc3, Cf3, Ac4, enroque, De2 y Td1, con presión por las columnas c y d abiertas.',
        'Es muy peligroso a nivel de club porque las jugadas naturales pueden perder rápido. Las negras pueden aceptar y defender con precisión, o rehusar con 3...d3, 3...Cf6 o 3...d5.',
      ],
    },
    structure: {
      en: 'White has given the d- and c-pawns for open files: rooks go to c1 and d1. Black has an extra pawn and a solid but passive centre (d6–e6).',
      es: 'Las blancas han dado los peones d y c a cambio de columnas abiertas: las torres van a c1 y d1. Las negras tienen un peón de más y un centro sólido pero pasivo (d6–e6).',
    },
    plans: {
      w: {
        en: ['Nc3, Nf3, Bc4, O-O, Qe2, Rd1 and Rc1.', 'Target d6 and f7; watch for Nd5 and e5 breaks.', 'Keep the initiative: material is less important than time.'],
        es: ['Cc3, Cf3, Ac4, O-O, De2, Td1 y Tc1.', 'Atacar d6 y f7; atento a las rupturas Cd5 y e5.', 'Mantener la iniciativa: el material importa menos que el tiempo.'],
      },
      b: {
        en: ['Develop carefully and castle quickly.', 'Avoid pinning traps on the d-file.', 'Give back the pawn with ...d5 when it frees the game.'],
        es: ['Desarrollar con cuidado y enrocar pronto.', 'Evitar trampas de clavada en la columna d.', 'Devolver el peón con ...d5 cuando libere el juego.'],
      },
    },
    lines: [tree('morra', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 c5')],
  },
];
