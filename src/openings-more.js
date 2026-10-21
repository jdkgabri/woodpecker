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
    lines: [tree('kings-gambit', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 e5 f4'),
      tree('kg-accepted', { en: 'Gambit accepted', es: 'Gambito aceptado' }, 'e4 e5 f4 exf4'),
    
      tree('kg-falkbeer', { en: 'Falkbeer Countergambit', es: 'Contragambito Falkbeer' }, 'e4 e5 f4 d5'),
    ],
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
    lines: [tree('scotch', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 e5 Nf3 Nc6 d4'),
      tree('scotch-classical', { en: 'Classical (4...Bc5)', es: 'Clásica (4...Ac5)' }, 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5'),
    
      tree('scotch-mieses', { en: 'Mieses (4...Nf6)', es: 'Mieses (4...Cf6)' }, 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6'),
    ],
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
    lines: [tree('ruy', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 e5 Nf3 Nc6 Bb5'),
      tree('ruy-closed', { en: 'Closed Ruy Lopez', es: 'Española Cerrada' }, 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O'),
    
      tree('ruy-berlin', { en: 'Berlin Defence', es: 'Defensa Berlinesa' }, 'e4 e5 Nf3 Nc6 Bb5 Nf6'),
    
      tree('ruy-exchange', { en: 'Exchange Variation', es: 'Variante del Cambio' }, 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6'),
    
      tree('ruy-open', { en: 'Open Variation', es: 'Variante Abierta' }, 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4'),
    
      tree('ruy-marshall', { en: 'Anti-Marshall', es: 'Anti-Marshall' }, 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O'),
    ],
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
    lines: [tree('london', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'd4'),
      tree('london-kid', { en: 'Against the King\'s Indian setup', es: 'Contra la estructura India de Rey' }, 'd4 Nf6 Bf4 g6'),
    
      tree('london-d5', { en: 'Against 1...d5', es: 'Contra 1...d5' }, 'd4 d5 Bf4'),
    ],
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
  // ---- alapin
  {
    id: 'alapin', side: 'w', vs: 'e4', eco: 'B22', puzzles: 'alapin',
    name: { en: 'Alapin Sicilian (2.c3)', es: 'Siciliana Alapin (2.c3)' },
    summary: {
      en: '1.e4 c5 2.c3 — prepares d4 to get the full centre and avoid the Open Sicilian theory.',
      es: '1.e4 c5 2.c3 — prepara d4 para tener todo el centro y evitar la teoría de la Siciliana abierta.',
    },
    intro: {
      en: [
        'The Alapin is a practical weapon against the Sicilian: White prepares d4 so that after ...cxd4 the c3-pawn recaptures and keeps two central pawns.',
        'Black\'s best answers strike at once: 2...d5 (the queen recaptures on d5 because c3 has taken the knight\'s square) or 2...Nf6, hitting e4. Slow replies give White the ideal centre.',
      ],
      es: [
        'La Alapin es un arma práctica contra la Siciliana: las blancas preparan d4 para que, tras ...cxd4, el peón de c3 recapture y mantengan dos peones centrales.',
        'Las mejores respuestas negras golpean de inmediato: 2...d5 (la dama recaptura en d5 porque c3 ha quitado la casilla al caballo) o 2...Cf6, atacando e4. Las respuestas lentas dan a las blancas el centro ideal.',
      ],
    },
    structure: {
      en: 'Often an isolated d-pawn for White after ...d5 and an exchange on d4, with active pieces; or after 2...Nf6 3.e5 a pawn on e5 that gains space.',
      es: 'A menudo un peón aislado en d4 para las blancas tras ...d5 y un cambio en d4, con piezas activas; o, tras 2...Cf6 3.e5, un peón en e5 que gana espacio.',
    },
    plans: {
      w: {
        en: ['d4 to build the centre.', 'Against ...Nf6, push e5 and chase the knight.', 'With an isolated d-pawn, attack on the kingside with active pieces.'],
        es: ['d4 para montar el centro.', 'Contra ...Cf6, avanzar e5 y perseguir al caballo.', 'Con peón aislado, atacar en el flanco de rey con piezas activas.'],
      },
      b: {
        en: ['Strike at once with ...d5 or ...Nf6.', 'Blockade an isolated pawn on d5.', 'Undermine e5 with ...d6.'],
        es: ['Golpear de inmediato con ...d5 o ...Cf6.', 'Bloquear el peón aislado en d5.', 'Socavar e5 con ...d6.'],
      },
    },
    lines: [tree('alapin', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 c5'),
      tree('alapin-d5', { en: 'Against 2...d5', es: 'Contra 2...d5' }, 'e4 c5 c3 d5'),
    ],
  },
  // ---- caro advance
  {
    id: 'caro-advance', side: 'w', vs: 'e4', eco: 'B12', puzzles: 'caro-advance',
    name: { en: 'Against the Caro-Kann: Advance', es: 'Contra la Caro-Kann: Avance' },
    summary: {
      en: '1.e4 c6 2.d4 d5 3.e5 — space and a quiet plan against Black\'s solid setup.',
      es: '1.e4 c6 2.d4 d5 3.e5 — espacio y un plan tranquilo contra la estructura sólida negra.',
    },
    intro: {
      en: [
        'In the Advance Caro-Kann White gains space with e5. Unlike in the French, Black\'s light-squared bishop comes out to f5 before ...e6, so White aims to chase it or to play c4 to open the centre.',
        'The quiet Short system (Nf3, Be2, O-O, c3) is easy to learn and leads to positions where White\'s space counts for a long time.',
      ],
      es: [
        'En el Avance de la Caro-Kann las blancas ganan espacio con e5. A diferencia de la Francesa, el alfil negro de casillas blancas sale a f5 antes de ...e6, así que las blancas intentan perseguirlo o jugar c4 para abrir el centro.',
        'El sistema tranquilo de Short (Cf3, Ae2, O-O, c3) es fácil de aprender y lleva a posiciones en las que el espacio blanco pesa durante mucho tiempo.',
      ],
    },
    structure: {
      en: 'Chain d4–e5 against c6–d5–e6, with Black\'s bishop outside the chain. Black usually breaks with ...c5; White may play c4 or keep the centre with c3.',
      es: 'Cadena d4–e5 contra c6–d5–e6, con el alfil negro fuera de la cadena. Las negras suelen romper con ...c5; las blancas pueden jugar c4 o mantener el centro con c3.',
    },
    plans: {
      w: {
        en: ['Nf3, Be2, O-O and c3 or Nbd2.', 'Chase the f5-bishop with Nh4 or g4 when it is safe.', 'Open the centre with c4 at the right moment.'],
        es: ['Cf3, Ae2, O-O y c3 o Cbd2.', 'Perseguir el alfil de f5 con Ch4 o g4 cuando sea seguro.', 'Abrir el centro con c4 en el momento justo.'],
      },
      b: {
        en: ['...Bf5 and ...e6, then ...c5.', '...Nd7, ...Ne7 and ...Nf5 or ...Ng6.', '...Qb6 against b2 and d4.'],
        es: ['...Af5 y ...e6, luego ...c5.', '...Cd7, ...Ce7 y ...Cf5 o ...Cg6.', '...Db6 contra b2 y d4.'],
      },
    },
    lines: [tree('caro-advance', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 c6')],
  },
  // ---- french advance
  {
    id: 'french-advance', side: 'w', vs: 'e4', eco: 'C02', puzzles: 'french-advance',
    name: { en: 'Against the French: Advance', es: 'Contra la Francesa: Avance' },
    summary: {
      en: '1.e4 e6 2.d4 d5 3.e5 — space with a pawn chain and play on the kingside.',
      es: '1.e4 e6 2.d4 d5 3.e5 — espacio con una cadena de peones y juego en el flanco de rey.',
    },
    intro: {
      en: [
        'With 3.e5 White closes the centre and gains space. The pawn chain d4–e5 cramps Black\'s kingside; Black attacks its base with ...c5 and ...Qb6, and later ...f6.',
        'This tree also covers Black\'s second-move alternatives after 1...e6, so you know what to do if the opponent avoids the French main lines.',
      ],
      es: [
        'Con 3.e5 las blancas cierran el centro y ganan espacio. La cadena d4–e5 encoge el flanco de rey negro; las negras atacan su base con ...c5 y ...Db6, y más tarde ...f6.',
        'Este árbol también cubre las alternativas negras en la segunda jugada tras 1...e6, para que sepas qué hacer si el rival evita las líneas principales de la Francesa.',
      ],
    },
    structure: {
      en: 'Chain d4–e5 against e6–d5. White keeps d4 with c3 and Nf3; Black pressures it with ...c5, ...Nc6, ...Qb6 and ...Nge7–f5.',
      es: 'Cadena d4–e5 contra e6–d5. Las blancas sostienen d4 con c3 y Cf3; las negras lo presionan con ...c5, ...Cc6, ...Db6 y ...Cge7–f5.',
    },
    plans: {
      w: {
        en: ['c3, Nf3 and Be2 or Bd3 to support d4.', 'a3 and b4 to gain queenside space.', 'Kingside attack based on the e5-pawn.'],
        es: ['c3, Cf3 y Ae2 o Ad3 para sostener d4.', 'a3 y b4 para ganar espacio en el flanco de dama.', 'Ataque en el flanco de rey basado en el peón de e5.'],
      },
      b: {
        en: ['Hit d4 with ...c5, ...Nc6 and ...Qb6.', 'Undermine e5 with ...f6.', 'Bring the knight to f5.'],
        es: ['Atacar d4 con ...c5, ...Cc6 y ...Db6.', 'Socavar e5 con ...f6.', 'Llevar el caballo a f5.'],
      },
    },
    lines: [tree('french-advance', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 e6')],
  },
  // ---- vienna
  {
    id: 'vienna', side: 'w', eco: 'C25–C29', puzzles: 'vienna',
    name: { en: 'Vienna Game', es: 'Partida Vienesa' },
    summary: {
      en: '1.e4 e5 2.Nc3 — flexible development that prepares f4 or Bc4, with many traps.',
      es: '1.e4 e5 2.Cc3 — desarrollo flexible que prepara f4 o Ac4, con muchas trampas.',
    },
    intro: {
      en: [
        'With 2.Nc3 White protects e4 and keeps the f-pawn free, so f4 can follow (the Vienna Gambit) once Black has committed.',
        'Black usually plays 2...Nf6 or 2...Nc6. After 2...Nf6 3.f4 the key reply is 3...d5!, striking in the centre; slow moves let White take over with e5.',
      ],
      es: [
        'Con 2.Cc3 las blancas protegen e4 y dejan libre el peón f, de modo que f4 puede llegar (Gambito Vienés) cuando las negras se hayan comprometido.',
        'Las negras suelen jugar 2...Cf6 o 2...Cc6. Tras 2...Cf6 3.f4 la respuesta clave es 3...d5!, golpeando en el centro; las jugadas lentas permiten a las blancas tomar la iniciativa con e5.',
      ],
    },
    structure: {
      en: 'After f4 and fxe5 White gets a half-open f-file and a pawn on e5 that cramps the black knight. If Black strikes with ...d5 first, the centre opens and both sides develop freely.',
      es: 'Tras f4 y fxe5 las blancas consiguen la columna f semiabierta y un peón en e5 que molesta al caballo negro. Si las negras golpean antes con ...d5, el centro se abre y ambos bandos desarrollan con libertad.',
    },
    plans: {
      w: {
        en: ['f4 and fxe5 to open the f-file.', 'Push e5 to kick the f6-knight.', 'Bc4 aiming at f7.'],
        es: ['f4 y fxe5 para abrir la columna f.', 'Empujar e5 para echar al caballo de f6.', 'Ac4 apuntando a f7.'],
      },
      b: {
        en: ['Answer f4 with ...d5!', 'Develop quickly and castle before the f-file opens.', 'Use the e5 square for a knight.'],
        es: ['Responder a f4 con ...d5!', 'Desarrollar rápido y enrocar antes de que se abra la columna f.', 'Usar la casilla e5 para un caballo.'],
      },
    },
    lines: [tree('vienna', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 e5 Nc3'),
      tree('vienna-gambit', { en: 'Vienna Gambit (2...Nf6 3.f4)', es: 'Gambito Vienés (2...Cf6 3.f4)' }, 'e4 e5 Nc3 Nf6 f4'),
    
      tree('vienna-nc6', { en: 'Against 2...Nc6', es: 'Contra 2...Cc6' }, 'e4 e5 Nc3 Nc6'),
    ],
  },
  // ---- vs scandinavian
  {
    id: 'vs-scandinavian', side: 'w', vs: 'e4', eco: 'B01', puzzles: 'vs-scandinavian',
    name: { en: 'Against the Scandinavian', es: 'Contra la Escandinava' },
    summary: {
      en: '1.e4 d5 2.exd5 — take the pawn and gain time against the black queen.',
      es: '1.e4 d5 2.exd5 — tomar el peón y ganar tiempo contra la dama negra.',
    },
    intro: {
      en: [
        'Against 1...d5 White simply takes and develops with tempo: after 2...Qxd5 3.Nc3 the queen has to move again, and White gets a lead in development and a pawn on d4.',
        'If Black recaptures with the knight (2...Nf6), White can play d4, Nf3 and c4 to gain space.',
      ],
      es: [
        'Contra 1...d5 las blancas simplemente toman y desarrollan ganando tiempo: tras 2...Dxd5 3.Cc3 la dama tiene que moverse otra vez, y las blancas consiguen ventaja en desarrollo y un peón en d4.',
        'Si las negras recapturan con el caballo (2...Cf6), las blancas pueden jugar d4, Cf3 y c4 para ganar espacio.',
      ],
    },
    structure: {
      en: 'White keeps a pawn on d4 against Black\'s c6–e6 (a Caro-Kann-like structure). White has more space and easier development.',
      es: 'Las blancas mantienen un peón en d4 frente a c6–e6 negro (una estructura parecida a la Caro-Kann). Las blancas tienen más espacio y un desarrollo más fácil.',
    },
    plans: {
      w: {
        en: ['Nc3 to gain time on the queen.', 'd4, Nf3, Bc4 or Bd3 and castling.', 'Use the extra space; Ne5 is often strong.'],
        es: ['Cc3 para ganar tiempo sobre la dama.', 'd4, Cf3, Ac4 o Ad3 y enroque.', 'Aprovechar el espacio extra; Ce5 suele ser fuerte.'],
      },
      b: {
        en: ['Put the queen on a5 or d6, safe from attack.', 'Develop the c8-bishop to f5 or g4 before ...e6.', 'Solid setup with ...c6 and ...e6.'],
        es: ['Colocar la dama en a5 o d6, a salvo de ataques.', 'Desarrollar el alfil de c8 a f5 o g4 antes de ...e6.', 'Estructura sólida con ...c6 y ...e6.'],
      },
    },
    lines: [tree('vs-scandinavian', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 d5')],
  },
  // ---- english
  {
    id: 'english', side: 'w', eco: 'A10–A39', puzzles: 'english',
    name: { en: 'English Opening', es: 'Apertura Inglesa' },
    summary: {
      en: '1.c4 — controls d5 from the side; a flexible opening with a kingside fianchetto.',
      es: '1.c4 — controla d5 desde el flanco; una apertura flexible con fianchetto en el flanco de rey.',
    },
    intro: {
      en: [
        'With 1.c4 White fights for d5 without committing the centre pawns. The usual setup is Nc3, g3, Bg2 and Nf3, often called a "reversed Sicilian".',
        'Black\'s main answers are 1...e5, 1...Nf6, 1...c5 (Symmetrical) and 1...e6. White adapts but keeps the same ideas: pressure on d5 and the long diagonal, and queenside play with b4 or Rb1.',
      ],
      es: [
        'Con 1.c4 las blancas luchan por d5 sin comprometer los peones centrales. La estructura habitual es Cc3, g3, Ag2 y Cf3, a menudo llamada "Siciliana invertida".',
        'Las respuestas principales de las negras son 1...e5, 1...Cf6, 1...c5 (Simétrica) y 1...e6. Las blancas se adaptan pero mantienen las mismas ideas: presión sobre d5 y la gran diagonal, y juego en el flanco de dama con b4 o Tb1.',
      ],
    },
    structure: {
      en: 'Pawns on c4, d3 and e2/e3 with the bishop on g2. White plays on the queenside (b4–b5) and on the light squares; Black often takes space with ...e5 and ...f5.',
      es: 'Peones en c4, d3 y e2/e3 con el alfil en g2. Las blancas juegan en el flanco de dama (b4–b5) y en las casillas blancas; las negras suelen ganar espacio con ...e5 y ...f5.',
    },
    plans: {
      w: {
        en: ['Nc3, g3, Bg2, Nf3 and castle.', 'Queenside expansion with Rb1, b4 and b5.', 'Control d5 with the knight and the bishop.'],
        es: ['Cc3, g3, Ag2, Cf3 y enroque.', 'Expansión en el flanco de dama con Tb1, b4 y b5.', 'Controlar d5 con el caballo y el alfil.'],
      },
      b: {
        en: ['Take space with ...e5 and ...f5.', 'Play ...d5 when it is well supported.', 'Mirror the fianchetto and fight for the long diagonal.'],
        es: ['Ganar espacio con ...e5 y ...f5.', 'Jugar ...d5 cuando esté bien apoyado.', 'Copiar el fianchetto y luchar por la gran diagonal.'],
      },
    },
    lines: [tree('english', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'c4'),
      tree('english-e5', { en: 'Reversed Sicilian (1...e5)', es: 'Siciliana Invertida (1...e5)' }, 'c4 e5'),
    
      tree('english-symmetrical', { en: 'Symmetrical (1...c5)', es: 'Simétrica (1...c5)' }, 'c4 c5'),
    ],
  },
  // ---- caro-kann
  {
    id: 'caro-kann', side: 'b', eco: 'B10–B19', puzzles: 'caro-kann',
    name: { en: 'Caro-Kann Defence', es: 'Defensa Caro-Kann' },
    summary: {
      en: '1.e4 c6 — prepare ...d5 with a sound structure and develop the bishop outside the chain.',
      es: '1.e4 c6 — preparar ...d5 con una estructura sana y desarrollar el alfil fuera de la cadena.',
    },
    intro: {
      en: [
        'The Caro-Kann prepares 2...d5 with the c-pawn instead of the e-pawn, so the light-squared bishop can come out to f5 or g4 before ...e6.',
        'Black gets one of the most solid positions in chess. White\'s main tries are the Advance (3.e5), the Classical (3.Nc3 dxe4 4.Nxe4) and the Exchange (3.exd5).',
      ],
      es: [
        'La Caro-Kann prepara 2...d5 con el peón c en lugar del peón e, para que el alfil de casillas blancas salga a f5 o g4 antes de ...e6.',
        'Las negras consiguen una de las posiciones más sólidas del ajedrez. Los intentos principales de las blancas son el Avance (3.e5), la Clásica (3.Cc3 dxe4 4.Cxe4) y el Cambio (3.exd5).',
      ],
    },
    structure: {
      en: 'Pawns on c6 and e6 with the bishop on f5 or g4 outside the chain. After ...dxe4 Black has a sound queenside majority; against e5, Black plays ...c5 later.',
      es: 'Peones en c6 y e6 con el alfil en f5 o g4 fuera de la cadena. Tras ...dxe4 las negras tienen una mayoría sana en el flanco de dama; contra e5, juegan ...c5 más tarde.',
    },
    plans: {
      b: {
        en: ['...d5, ...Bf5, ...e6 and ...Nd7.', 'Break with ...c5 against the Advance.', 'Trade pieces and use the better structure in the endgame.'],
        es: ['...d5, ...Af5, ...e6 y ...Cd7.', 'Romper con ...c5 contra el Avance.', 'Cambiar piezas y aprovechar la mejor estructura en el final.'],
      },
      w: {
        en: ['Gain space with e5.', 'Chase the bishop with h4–h5 or Nh4.', 'Attack the kingside before Black is fully developed.'],
        es: ['Ganar espacio con e5.', 'Perseguir el alfil con h4–h5 o Ch4.', 'Atacar en el flanco de rey antes de que las negras completen su desarrollo.'],
      },
    },
    lines: [tree('caro-kann', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'e4 c6'),
      tree('caro-classical', { en: 'Classical (4...Bf5)', es: 'Clásica (4...Af5)' }, 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5'),
    
      tree('caro-advance-black', { en: 'Against the Advance', es: 'Contra el Avance' }, 'e4 c6 d4 d5 e5 Bf5'),
    
      tree('caro-panov', { en: 'Against the Panov Attack', es: 'Contra el Ataque Panov' }, 'e4 c6 d4 d5 exd5 cxd5 c4'),
    ],
  },
  // ---- scandinavian
  {
    id: 'scandinavian', side: 'b', eco: 'B01', puzzles: 'scandinavian',
    name: { en: 'Scandinavian Defence', es: 'Defensa Escandinava' },
    summary: {
      en: '1.e4 d5 — challenge e4 at once and take back with the queen.',
      es: '1.e4 d5 — discutir e4 de inmediato y recapturar con la dama.',
    },
    intro: {
      en: [
        'The Scandinavian forces matters on move one: after 2.exd5 Qxd5 3.Nc3 the queen retreats (usually to a5 or d6) and Black develops with ...Nf6, ...Bf5 or ...Bg4, ...e6 and ...c6.',
        'The structure is simple and the plans are easy to learn, which makes it a good practical choice. The danger is White\'s lead in development if Black is careless with the queen.',
      ],
      es: [
        'La Escandinava fuerza la situación en la primera jugada: tras 2.exd5 Dxd5 3.Cc3 la dama se retira (normalmente a a5 o d6) y las negras desarrollan con ...Cf6, ...Af5 o ...Ag4, ...e6 y ...c6.',
        'La estructura es sencilla y los planes fáciles de aprender, lo que la convierte en una buena opción práctica. El peligro es la ventaja en desarrollo blanca si las negras descuidan la dama.',
      ],
    },
    structure: {
      en: 'Black gets c6–e6 against White\'s d4, like a Caro-Kann, with the light-squared bishop outside the chain.',
      es: 'Las negras consiguen c6–e6 frente a d4 blanco, como en la Caro-Kann, con el alfil de casillas blancas fuera de la cadena.',
    },
    plans: {
      b: {
        en: ['Queen to a5 or d6, then ...Nf6 and ...Bf5 or ...Bg4.', '...c6 and ...e6 for a solid centre.', 'Castle and use the half-open d-file.'],
        es: ['Dama a a5 o d6, luego ...Cf6 y ...Af5 o ...Ag4.', '...c6 y ...e6 para un centro sólido.', 'Enrocar y aprovechar la columna d semiabierta.'],
      },
      w: {
        en: ['Gain time on the queen with Nc3.', 'd4 and quick development.', 'Use the lead in development before Black castles.'],
        es: ['Ganar tiempo sobre la dama con Cc3.', 'd4 y desarrollo rápido.', 'Aprovechar la ventaja en desarrollo antes de que las negras enroquen.'],
      },
    },
    lines: [tree('scandinavian', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'e4 d5')],
  },
  // ---- pirc
  {
    id: 'pirc', side: 'b', eco: 'B07–B09', puzzles: 'pirc',
    name: { en: 'Pirc Defence', es: 'Defensa Pirc' },
    summary: {
      en: '1.e4 d6 2.d4 Nf6 3.Nc3 g6 — let White build a centre and attack it from the flanks.',
      es: '1.e4 d6 2.d4 Cf6 3.Cc3 g6 — dejar que las blancas monten el centro y atacarlo desde los flancos.',
    },
    intro: {
      en: [
        'In the Pirc Black fianchettoes the king\'s bishop and castles quickly, inviting White to build a big centre that will be attacked later with ...c5 or ...e5.',
        'White\'s most aggressive tries are the Austrian Attack (f4) and the 150 Attack (Be3, Qd2, Bh6), aiming at Black\'s king. Accurate timing of ...c5 or ...e5 is the key.',
      ],
      es: [
        'En la Pirc las negras hacen el fianchetto del alfil de rey y enrocan pronto, invitando a las blancas a montar un gran centro que se atacará después con ...c5 o ...e5.',
        'Los intentos más agresivos de las blancas son el Ataque Austriaco (f4) y el Ataque 150 (Ae3, Dd2, Ah6), contra el rey negro. La clave es el momento justo para ...c5 o ...e5.',
      ],
    },
    structure: {
      en: 'Black: d6–g6 with the bishop on g7. White: e4–d4 (sometimes f4). The centre is attacked with ...c5 or ...e5; if it advances (e5 or d5), Black undermines it.',
      es: 'Negras: d6–g6 con el alfil en g7. Blancas: e4–d4 (a veces f4). El centro se ataca con ...c5 o ...e5; si avanza (e5 o d5), las negras lo socavan.',
    },
    plans: {
      b: {
        en: ['...Bg7 and castle quickly.', 'Strike with ...c5 or ...e5.', 'Queenside play with ...c6, ...b5 against the 150 Attack.'],
        es: ['...Ag7 y enrocar pronto.', 'Golpear con ...c5 o ...e5.', 'Juego en el flanco de dama con ...c6 y ...b5 contra el Ataque 150.'],
      },
      w: {
        en: ['Big centre with f4 (Austrian Attack).', 'Be3, Qd2 and Bh6 to trade the g7-bishop.', 'Kingside attack with h4–h5.'],
        es: ['Gran centro con f4 (Ataque Austriaco).', 'Ae3, Dd2 y Ah6 para cambiar el alfil de g7.', 'Ataque en el flanco de rey con h4–h5.'],
      },
    },
    lines: [tree('pirc', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'e4 d6 d4 Nf6 Nc3 g6'),
      tree('pirc-austrian', { en: 'Against the Austrian Attack (f4)', es: 'Contra el Ataque Austriaco (f4)' }, 'e4 d6 d4 Nf6 Nc3 g6 f4'),
    
      tree('pirc-150', { en: 'Against the 150 Attack (Be3)', es: 'Contra el Ataque 150 (Ae3)' }, 'e4 d6 d4 Nf6 Nc3 g6 Be3'),
    ],
  },
  // ---- alekhine
  {
    id: 'alekhine', side: 'b', eco: 'B02–B05', puzzles: 'alekhine',
    name: { en: 'Alekhine Defence', es: 'Defensa Alekhine' },
    summary: {
      en: '1.e4 Nf6 — provoke White\'s pawns forward and attack them.',
      es: '1.e4 Cf6 — provocar el avance de los peones blancos y atacarlos.',
    },
    intro: {
      en: [
        'After 1.e4 Nf6 2.e5 Nd5 the knight invites White to chase it with c4 and d4. White gains a huge centre, but it can become a target for ...d6 and pressure from Black\'s pieces.',
        'The quiet Modern Variation (2.e5 Nd5 3.d4 d6 4.Nf3) is the most common at club level. Black usually develops with ...Bg4 or ...g6.',
      ],
      es: [
        'Tras 1.e4 Cf6 2.e5 Cd5 el caballo invita a las blancas a perseguirlo con c4 y d4. Las blancas ganan un centro enorme, pero puede convertirse en un objetivo para ...d6 y la presión de las piezas negras.',
        'La Variante Moderna, tranquila (2.e5 Cd5 3.d4 d6 4.Cf3), es la más común a nivel de club. Las negras suelen desarrollar con ...Ag4 o ...g6.',
      ],
    },
    structure: {
      en: 'White\'s pawns on d4 and e5 (sometimes c4 and f4) against Black\'s d6. Black trades on e5 and attacks d4; if White overextends, the centre collapses.',
      es: 'Peones blancos en d4 y e5 (a veces c4 y f4) frente al d6 negro. Las negras cambian en e5 y atacan d4; si las blancas se extienden demasiado, el centro se derrumba.',
    },
    plans: {
      b: {
        en: ['...d6 to challenge e5.', '...Bg4 against the f3-knight to weaken d4.', 'Knights to b6 and c6, pressure on d4.'],
        es: ['...d6 para discutir e5.', '...Ag4 contra el caballo de f3 para debilitar d4.', 'Caballos a b6 y c6, presión sobre d4.'],
      },
      w: {
        en: ['Gain space with c4 and d4.', 'Keep the e5-pawn as a wedge.', 'Avoid overextending: develop before pushing f4.'],
        es: ['Ganar espacio con c4 y d4.', 'Mantener el peón de e5 como cuña.', 'No extenderse demasiado: desarrollar antes de empujar f4.'],
      },
    },
    lines: [tree('alekhine', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'e4 Nf6')],
  },
  // ---- petrov
  {
    id: 'petrov', side: 'b', eco: 'C42–C43', puzzles: 'petrov',
    name: { en: 'Petrov Defence', es: 'Defensa Petrov' },
    summary: {
      en: '1.e4 e5 2.Nf3 Nf6 — counterattack e4 instead of defending e5; very solid.',
      es: '1.e4 e5 2.Cf3 Cf6 — contraatacar e4 en vez de defender e5; muy sólida.',
    },
    intro: {
      en: [
        'In the Petrov Black copies White\'s attack. The main line is 3.Nxe5 d6! (not 3...Nxe4? 4.Qe2) 4.Nf3 Nxe4, with a symmetrical and very solid position.',
        'It is known as a drawish opening at top level, but at club level it is full of traps for both sides, starting with the famous 3...Nxe4? 4.Qe2 and the Stafford Gambit (3...Nc6).',
      ],
      es: [
        'En la Petrov las negras copian el ataque blanco. La línea principal es 3.Cxe5 d6! (no 3...Cxe4? 4.De2) 4.Cf3 Cxe4, con una posición simétrica y muy sólida.',
        'Tiene fama de tablista a nivel de élite, pero a nivel de club está llena de trampas para ambos bandos, empezando por la famosa 3...Cxe4? 4.De2 y el Gambito Stafford (3...Cc6).',
      ],
    },
    structure: {
      en: 'Symmetrical structures with open e-file. Black keeps a knight on e4 supported by ...d5 and develops harmoniously.',
      es: 'Estructuras simétricas con la columna e abierta. Las negras mantienen un caballo en e4 apoyado por ...d5 y desarrollan con armonía.',
    },
    plans: {
      b: {
        en: ['3...d6 first, then ...Nxe4.', 'Support the e4-knight with ...d5 and ...Bd6.', 'Castle and contest the e-file.'],
        es: ['Primero 3...d6, luego ...Cxe4.', 'Apoyar el caballo de e4 con ...d5 y ...Ad6.', 'Enrocar y disputar la columna e.'],
      },
      w: {
        en: ['Chase the e4-knight with Nc3 or c4.', 'Pin on the e-file with Qe2 and Re1.', 'Castle long for an attack.'],
        es: ['Perseguir el caballo de e4 con Cc3 o c4.', 'Clavar en la columna e con De2 y Te1.', 'Enroque largo para atacar.'],
      },
    },
    lines: [tree('petrov', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'e4 e5 Nf3 Nf6')],
  },
  // ---- king's indian
  {
    id: 'kings-indian', side: 'b', eco: 'E60–E99', puzzles: 'kings-indian',
    name: { en: 'King\'s Indian Defence', es: 'Defensa India de Rey' },
    summary: {
      en: '1.d4 Nf6 with ...g6, ...Bg7, ...d6, ...O-O and ...e5 — a counterattacking setup against almost everything.',
      es: '1.d4 Cf6 con ...g6, ...Ag7, ...d6, ...O-O y ...e5 — una estructura de contraataque contra casi todo.',
    },
    intro: {
      en: [
        'The King\'s Indian lets White take the centre and strikes later with ...e5 (or ...c5). The fianchettoed bishop on g7 is Black\'s best piece.',
        'In the closed lines (White plays d5) Black attacks on the kingside with ...f5, while White attacks on the queenside with c5. This tree starts from 1...Nf6, so it also covers the London, the Trompowsky and other systems.',
      ],
      es: [
        'La India de Rey deja que las blancas tomen el centro y golpea después con ...e5 (o ...c5). El alfil en fianchetto de g7 es la mejor pieza negra.',
        'En las líneas cerradas (las blancas juegan d5) las negras atacan en el flanco de rey con ...f5, mientras las blancas atacan en el de dama con c5. Este árbol empieza en 1...Cf6, así que también cubre la Londres, el Trompowsky y otros sistemas.',
      ],
    },
    structure: {
      en: 'Black: d6–e5 with the bishop on g7. If White closes the centre with d5, the pawn chains point to opposite wings: Black plays ...f5–f4 and White c4–c5.',
      es: 'Negras: d6–e5 con el alfil en g7. Si las blancas cierran el centro con d5, las cadenas apuntan a flancos opuestos: las negras juegan ...f5–f4 y las blancas c4–c5.',
    },
    plans: {
      b: {
        en: ['...g6, ...Bg7, ...d6, ...O-O and ...e5.', 'In closed centres, ...Ne8 or ...Nh5 and ...f5.', 'In open centres, use the g7-bishop and the e5 square.'],
        es: ['...g6, ...Ag7, ...d6, ...O-O y ...e5.', 'Con el centro cerrado, ...Ce8 o ...Ch5 y ...f5.', 'Con el centro abierto, aprovechar el alfil de g7 y la casilla e5.'],
      },
      w: {
        en: ['Take the centre with c4, e4 and d4.', 'Close it with d5 and attack on the queenside with c5.', 'Sämisch (f3) and Be3–Qd2 setups to attack the king.'],
        es: ['Tomar el centro con c4, e4 y d4.', 'Cerrarlo con d5 y atacar en el flanco de dama con c5.', 'Estructuras Sämisch (f3) y Ae3–Dd2 para atacar al rey.'],
      },
    },
    lines: [tree('kings-indian', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 Nf6'),
      tree('kid-samisch', { en: 'Against the Sämisch (f3)', es: 'Contra la Sämisch (f3)' }, 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3'),
    
      tree('kid-fianchetto', { en: 'Against the Fianchetto (g3)', es: 'Contra el Fianchetto (g3)' }, 'd4 Nf6 c4 g6 Nf3 Bg7 g3'),
    ],
  },
  // ---- grunfeld
  {
    id: 'grunfeld', side: 'b', eco: 'D70–D99', puzzles: 'grunfeld',
    name: { en: 'Grünfeld Defence', es: 'Defensa Grünfeld' },
    summary: {
      en: '1.d4 Nf6 2.c4 g6 3.Nc3 d5 — give White the centre and destroy it with pieces and ...c5.',
      es: '1.d4 Cf6 2.c4 g6 3.Cc3 d5 — dar el centro a las blancas y destruirlo con piezas y ...c5.',
    },
    intro: {
      en: [
        'In the Grünfeld Black lets White build a big pawn centre (Exchange Variation: cxd5 Nxd5 e4 Nxc3 bxc3) and then attacks it with ...Bg7, ...c5 and ...Nc6.',
        'It is a dynamic and concrete defence: Black must know the key ideas, because White\'s centre can also become a powerful attacking force.',
      ],
      es: [
        'En la Grünfeld las negras dejan que las blancas monten un gran centro de peones (Variante del Cambio: cxd5 Cxd5 e4 Cxc3 bxc3) y luego lo atacan con ...Ag7, ...c5 y ...Cc6.',
        'Es una defensa dinámica y concreta: las negras deben conocer las ideas clave, porque el centro blanco también puede convertirse en una poderosa fuerza de ataque.',
      ],
    },
    structure: {
      en: 'White: c3–d4–e4 after the exchange. Black: the g7-bishop and ...c5 against d4. If White keeps d4, Black often gets a queenside pawn majority for the endgame.',
      es: 'Blancas: c3–d4–e4 tras el cambio. Negras: el alfil de g7 y ...c5 contra d4. Si las blancas mantienen d4, las negras suelen conseguir mayoría en el flanco de dama para el final.',
    },
    plans: {
      b: {
        en: ['...d5, ...Nxd5 and ...Nxc3.', '...Bg7, ...c5 and ...Nc6 against d4.', '...Bg4 to pressure d4 through the f3-knight.'],
        es: ['...d5, ...Cxd5 y ...Cxc3.', '...Ag7, ...c5 y ...Cc6 contra d4.', '...Ag4 para presionar d4 a través del caballo de f3.'],
      },
      w: {
        en: ['Build the centre with e4 and keep d4 protected.', 'Push d5 at the right moment.', 'Attack on the kingside with h4 or f4–f5.'],
        es: ['Montar el centro con e4 y mantener d4 protegido.', 'Empujar d5 en el momento justo.', 'Atacar en el flanco de rey con h4 o f4–f5.'],
      },
    },
    lines: [tree('grunfeld', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 Nf6 c4 g6 Nc3'),
      tree('grunfeld-exchange', { en: 'Exchange Variation', es: 'Variante del Cambio' }, 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7'),
    ],
  },
  // ---- queen's indian
  {
    id: 'queens-indian', side: 'b', eco: 'E12–E19', puzzles: 'queens-indian',
    name: { en: 'Queen\'s Indian Defence', es: 'Defensa India de Dama' },
    summary: {
      en: '1.d4 Nf6 2.c4 e6 3.Nf3 b6 — control e4 from a distance with the fianchettoed bishop.',
      es: '1.d4 Cf6 2.c4 e6 3.Cf3 b6 — controlar e4 a distancia con el alfil en fianchetto.',
    },
    intro: {
      en: [
        'When White avoids the Nimzo-Indian with 3.Nf3, Black plays ...b6 and ...Bb7 (or ...Ba6, hitting c4) to fight for the e4 square.',
        'It is a solid and flexible defence. White usually fianchettoes too (g3 and Bg2) or plays a3 to prevent ...Bb4.',
      ],
      es: [
        'Cuando las blancas evitan la Nimzoindia con 3.Cf3, las negras juegan ...b6 y ...Ab7 (o ...Aa6, atacando c4) para luchar por la casilla e4.',
        'Es una defensa sólida y flexible. Las blancas suelen hacer también el fianchetto (g3 y Ag2) o jugar a3 para evitar ...Ab4.',
      ],
    },
    structure: {
      en: 'Black keeps the centre flexible (e6, d6 or d5) with the bishop on b7 controlling e4. Breaks with ...c5 or ...d5 free the game.',
      es: 'Las negras mantienen el centro flexible (e6, d6 o d5) con el alfil en b7 controlando e4. Las rupturas ...c5 o ...d5 liberan el juego.',
    },
    plans: {
      b: {
        en: ['...b6 and ...Bb7 or ...Ba6.', 'Control e4; ...Ne4 when possible.', 'Free the game with ...c5 or ...d5.'],
        es: ['...b6 y ...Ab7 o ...Aa6.', 'Controlar e4; ...Ce4 cuando sea posible.', 'Liberar el juego con ...c5 o ...d5.'],
      },
      w: {
        en: ['g3 and Bg2 to fight for the long diagonal.', 'Build the centre with Nc3 and e4.', 'a3 to prevent ...Bb4.'],
        es: ['g3 y Ag2 para luchar por la gran diagonal.', 'Montar el centro con Cc3 y e4.', 'a3 para evitar ...Ab4.'],
      },
    },
    lines: [tree('queens-indian', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 Nf6 c4 e6 Nf3')],
  },
  // ---- dutch
  {
    id: 'dutch', side: 'b', eco: 'A80–A99', puzzles: 'dutch',
    name: { en: 'Dutch Defence', es: 'Defensa Holandesa' },
    summary: {
      en: '1.d4 f5 — control e4 and prepare a kingside attack; unbalanced from move one.',
      es: '1.d4 f5 — controlar e4 y preparar un ataque en el flanco de rey; desequilibrada desde la primera jugada.',
    },
    intro: {
      en: [
        'With 1...f5 Black controls e4 and plans to attack on the kingside. Main setups are the Leningrad (...g6, ...Bg7), the Stonewall (...e6, ...d5, ...c6) and the Classical (...e6, ...Be7).',
        'The weakened e8–h5 diagonal and the e5/e6 squares are the price; White\'s sharpest tries are early gambits such as 2.e4 (Staunton Gambit) or 2.Bg5.',
      ],
      es: [
        'Con 1...f5 las negras controlan e4 y preparan un ataque en el flanco de rey. Las estructuras principales son la Leningrado (...g6, ...Ag7), el Muro de Piedra (...e6, ...d5, ...c6) y la Clásica (...e6, ...Ae7).',
        'El precio es la diagonal e8–h5 debilitada y las casillas e5 y e6; los intentos más agudos de las blancas son gambitos tempranos como 2.e4 (Gambito Staunton) o 2.Ag5.',
      ],
    },
    structure: {
      en: 'Black: f5 with either g6 (Leningrad) or e6–d5 (Stonewall). White usually fianchettoes and fights for e4 with Nc3 and f3 or e4.',
      es: 'Negras: f5 con g6 (Leningrado) o e6–d5 (Muro de Piedra). Las blancas suelen hacer el fianchetto y luchar por e4 con Cc3 y f3 o e4.',
    },
    plans: {
      b: {
        en: ['...Nf6, ...e6 or ...g6, then castle.', 'Control e4 and attack with ...Qe8–h5.', 'Break with ...e5 in the Leningrad.'],
        es: ['...Cf6, ...e6 o ...g6, luego enroque.', 'Controlar e4 y atacar con ...De8–h5.', 'Romper con ...e5 en la Leningrado.'],
      },
      w: {
        en: ['Fianchetto with g3 and Bg2.', 'Break with e4 to open lines.', 'Use the e5 square and the weak e6-pawn.'],
        es: ['Fianchetto con g3 y Ag2.', 'Romper con e4 para abrir líneas.', 'Aprovechar la casilla e5 y el débil peón de e6.'],
      },
    },
    lines: [tree('dutch', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 f5')],
  },
  // ---- slav (black)
  {
    id: 'slav-black', side: 'b', vs: 'd4', eco: 'D10–D19', puzzles: 'slav-black',
    name: { en: 'Slav Defence (as Black)', es: 'Defensa Eslava (con negras)' },
    summary: {
      en: '1.d4 d5 2.c4 c6 — hold d5 with the c-pawn and develop the bishop outside the chain.',
      es: '1.d4 d5 2.c4 c6 — sostener d5 con el peón c y desarrollar el alfil fuera de la cadena.',
    },
    intro: {
      en: [
        'The Slav defends d5 with ...c6 instead of ...e6, so the c8-bishop can come out to f5 or g4. After ...dxc4 Black can try to keep the pawn with ...b5 if White is careless.',
        'It is one of the most reliable answers to the Queen\'s Gambit, with clear plans and a sound structure.',
      ],
      es: [
        'La Eslava defiende d5 con ...c6 en lugar de ...e6, para que el alfil de c8 salga a f5 o g4. Tras ...dxc4 las negras pueden intentar conservar el peón con ...b5 si las blancas se descuidan.',
        'Es una de las respuestas más fiables al Gambito de Dama, con planes claros y una estructura sana.',
      ],
    },
    structure: {
      en: 'Pawns on c6–d5 (later e6) with the bishop on f5 or g4. Black often takes on c4 and frees the game with ...c5 or ...e5.',
      es: 'Peones en c6–d5 (más tarde e6) con el alfil en f5 o g4. Las negras suelen tomar en c4 y liberar el juego con ...c5 o ...e5.',
    },
    plans: {
      b: {
        en: ['...Nf6, ...dxc4 and ...Bf5.', '...e6, ...Bb4 and ...O-O.', 'Break with ...c5 or ...e5.'],
        es: ['...Cf6, ...dxc4 y ...Af5.', '...e6, ...Ab4 y ...O-O.', 'Romper con ...c5 o ...e5.'],
      },
      w: {
        en: ['a4 to stop ...b5, then win back c4.', 'Build the centre with e4.', 'Exchange on d5 for a symmetrical but slightly better position.'],
        es: ['a4 para evitar ...b5 y recuperar c4.', 'Montar el centro con e4.', 'Cambiar en d5 para una posición simétrica pero algo mejor.'],
      },
    },
    lines: [tree('slav-black', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 d5 c4 c6')],
  },
  // ---- qgd (black)
  {
    id: 'qgd-black', side: 'b', vs: 'd4', eco: 'D30–D69', puzzles: 'qgd-black',
    name: { en: 'Queen\'s Gambit Declined (as Black)', es: 'Gambito de Dama Rehusado (con negras)' },
    summary: {
      en: '1.d4 d5 with ...e6 and ...Nf6 — the classical, rock-solid answer to 1.d4.',
      es: '1.d4 d5 con ...e6 y ...Cf6 — la respuesta clásica y sólida como una roca a 1.d4.',
    },
    intro: {
      en: [
        'Black keeps the pawn on d5 with ...e6, develops with ...Nf6, ...Be7 and ...O-O and frees the game later with ...c5 or ...dxc4 and ...e5.',
        'This tree starts after 1.d4 d5, so it also covers the London, the Colle and other systems that do not play c4.',
      ],
      es: [
        'Las negras mantienen el peón en d5 con ...e6, desarrollan con ...Cf6, ...Ae7 y ...O-O y liberan el juego más tarde con ...c5 o ...dxc4 y ...e5.',
        'Este árbol empieza tras 1.d4 d5, así que también cubre la Londres, el Colle y otros sistemas que no juegan c4.',
      ],
    },
    structure: {
      en: 'd5–e6 against d4–c4. Black\'s light-squared bishop is the problem piece: ...b6 and ...Bb7 or ...dxc4 and ...e5 free it.',
      es: 'd5–e6 contra d4–c4. El alfil negro de casillas blancas es la pieza problemática: ...b6 y ...Ab7 o ...dxc4 y ...e5 lo liberan.',
    },
    plans: {
      b: {
        en: ['...Nf6, ...Be7, ...O-O and ...h6.', 'Free the game with ...c5 or ...dxc4 and ...e5.', '...b6 and ...Bb7 to activate the bishop.'],
        es: ['...Cf6, ...Ae7, ...O-O y ...h6.', 'Liberar el juego con ...c5 o ...dxc4 y ...e5.', '...b6 y ...Ab7 para activar el alfil.'],
      },
      w: {
        en: ['Bg5 to pin the knight.', 'Minority attack with b4–b5 in the Exchange structure.', 'Central break with e4.'],
        es: ['Ag5 para clavar el caballo.', 'Ataque de minorías con b4–b5 en la estructura del Cambio.', 'Ruptura central con e4.'],
      },
    },
    lines: [tree('qgd-black', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 d5')],
  },
  // ---- benko
  {
    id: 'benko', side: 'b', vs: 'd4', eco: 'A57–A59', puzzles: 'benko',
    name: { en: 'Benko Gambit', es: 'Gambito Benko' },
    summary: {
      en: '1.d4 Nf6 2.c4 c5 3.d5 b5 — a pawn for long-term pressure on the a- and b-files.',
      es: '1.d4 Cf6 2.c4 c5 3.d5 b5 — un peón a cambio de presión duradera por las columnas a y b.',
    },
    intro: {
      en: [
        'When White advances d5, Black gives a pawn with ...b5. After cxb5 a6 bxa6 Bxa6 the rooks use the open a- and b-files and the g7-bishop rakes the long diagonal.',
        'The compensation lasts even into the endgame, which makes it a favourite of players who like clear plans rather than sharp tactics.',
      ],
      es: [
        'Cuando las blancas avanzan d5, las negras entregan un peón con ...b5. Tras cxb5 a6 bxa6 Axa6 las torres usan las columnas a y b abiertas y el alfil de g7 barre la gran diagonal.',
        'La compensación dura incluso en el final, por eso la eligen jugadores que prefieren planes claros a la táctica aguda.',
      ],
    },
    structure: {
      en: 'White\'s pawn on d5 and an extra queenside pawn; Black\'s pawns on c5 and d6 with open a- and b-files and the bishop on g7.',
      es: 'Peón blanco en d5 y un peón de más en el flanco de dama; peones negros en c5 y d6 con las columnas a y b abiertas y el alfil en g7.',
    },
    plans: {
      b: {
        en: ['...b5, ...a6 and ...Bxa6.', '...g6, ...Bg7, ...d6 and ...O-O.', 'Rooks on a8 and b8, queen on a5 or b6.'],
        es: ['...b5, ...a6 y ...Axa6.', '...g6, ...Ag7, ...d6 y ...O-O.', 'Torres en a8 y b8, dama en a5 o b6.'],
      },
      w: {
        en: ['Keep the extra pawn and trade pieces.', 'Central break with e4–e5.', 'Decline with Nf3 or a4 if you prefer.'],
        es: ['Conservar el peón extra y cambiar piezas.', 'Ruptura central con e4–e5.', 'Rehusar con Cf3 o a4 si lo prefieres.'],
      },
    },
    lines: [tree('benko', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 Nf6 c4 c5 d5')],
  },
  // ---- budapest
  {
    id: 'budapest', side: 'b', vs: 'd4', eco: 'A51–A52', puzzles: 'budapest',
    name: { en: 'Budapest Gambit', es: 'Gambito Budapest' },
    summary: {
      en: '1.d4 Nf6 2.c4 e5 — a surprise gambit where Black usually wins the pawn back.',
      es: '1.d4 Cf6 2.c4 e5 — un gambito sorpresa en el que las negras suelen recuperar el peón.',
    },
    intro: {
      en: [
        'After 3.dxe5 Ng4 Black attacks the e5-pawn with ...Nc6 and ...Bb4+, and normally wins it back with active pieces. White must be careful: there are several traps on the e1–h4 and a5–e1 diagonals.',
        'It is a good practical weapon at club level, where many players do not know the right setup.',
      ],
      es: [
        'Tras 3.dxe5 Cg4 las negras atacan el peón de e5 con ...Cc6 y ...Ab4+, y normalmente lo recuperan con piezas activas. Las blancas deben tener cuidado: hay varias trampas en las diagonales e1–h4 y a5–e1.',
        'Es un arma práctica buena a nivel de club, donde muchos jugadores no conocen la estructura correcta.',
      ],
    },
    structure: {
      en: 'Once Black regains the pawn, material is level: White keeps the c4-pawn and some space, Black has quick development and a strong knight on e5.',
      es: 'Cuando las negras recuperan el peón, el material queda igualado: las blancas conservan el peón de c4 y algo de espacio; las negras tienen desarrollo rápido y un caballo fuerte en e5.',
    },
    plans: {
      b: {
        en: ['...Ng4, ...Nc6 and ...Bb4+ to win back e5.', '...Qe7 to add pressure.', 'Use the active pieces against White\'s king.'],
        es: ['...Cg4, ...Cc6 y ...Ab4+ para recuperar e5.', '...De7 para añadir presión.', 'Aprovechar las piezas activas contra el rey blanco.'],
      },
      w: {
        en: ['Defend e5 with Bf4 and Nf3.', 'Give the pawn back at the right moment for a lead in space.', 'Watch out for ...Bb4+ and ...Qh4 tricks.'],
        es: ['Defender e5 con Af4 y Cf3.', 'Devolver el peón en el momento justo a cambio de espacio.', 'Cuidado con los trucos ...Ab4+ y ...Dh4.'],
      },
    },
    lines: [tree('budapest', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 Nf6 c4 e5')],
  },
  // ---- french
  {
    id: 'french', side: 'b', eco: 'C00–C19', puzzles: 'french',
    name: { en: 'French Defence', es: 'Defensa Francesa' },
    summary: {
      en: '1.e4 e6 — a solid pawn chain and counterattack against White\'s centre.',
      es: '1.e4 e6 — una cadena de peones sólida y contraataque contra el centro blanco.',
    },
    intro: {
      en: [
        'After 1.e4 e6 2.d4 d5 Black challenges e4 at once. White must decide: advance with e5, defend with Nc3 or Nd2, or exchange on d5.',
        'The French is a fighting defence: Black accepts a little less space in exchange for a solid position and clear targets, mainly the d4-pawn, attacked with ...c5.',
      ],
      es: [
        'Tras 1.e4 e6 2.d4 d5 las negras discuten e4 de inmediato. Las blancas deben decidir: avanzar con e5, defender con Cc3 o Cd2, o cambiar en d5.',
        'La Francesa es una defensa combativa: las negras aceptan un poco menos de espacio a cambio de una posición sólida y objetivos claros, sobre todo el peón de d4, atacado con ...c5.',
      ],
    },
    structure: {
      en: 'Black\'s chain e6–d5 against White\'s d4–e5. Black attacks the base (d4) with ...c5 and the head (e5) with ...f6. The light-squared bishop is the "bad" piece; trading it or freeing it with ...b6 and ...Ba6 is a typical aim.',
      es: 'La cadena negra e6–d5 contra d4–e5 blanca. Las negras atacan la base (d4) con ...c5 y la cabeza (e5) con ...f6. El alfil de casillas blancas es la pieza "mala"; cambiarlo o liberarlo con ...b6 y ...Aa6 es un objetivo típico.',
    },
    plans: {
      b: {
        en: ['...c5, ...Nc6 and ...Qb6 against d4.', '...f6 to break the e5-pawn.', 'Against Nc3, pin it with ...Bb4 or take on e4.'],
        es: ['...c5, ...Cc6 y ...Db6 contra d4.', '...f6 para romper el peón de e5.', 'Contra Cc3, clavarlo con ...Ab4 o tomar en e4.'],
      },
      w: {
        en: ['Gain space with e5 and attack on the kingside.', 'Keep d4 with c3 and Nf3.', 'Use the bad French bishop as a target.'],
        es: ['Ganar espacio con e5 y atacar en el flanco de rey.', 'Sostener d4 con c3 y Cf3.', 'Aprovechar el mal alfil francés.'],
      },
    },
    lines: [tree('french', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'e4 e6'),
      tree('french-tarrasch', { en: 'Against the Tarrasch (3.Nd2)', es: 'Contra la Tarrasch (3.Cd2)' }, 'e4 e6 d4 d5 Nd2'),
    
      tree('french-winawer', { en: 'Winawer (3...Bb4)', es: 'Winawer (3...Ab4)' }, 'e4 e6 d4 d5 Nc3 Bb4'),
    
      tree('french-advance-black', { en: 'Against the Advance (3.e5)', es: 'Contra el Avance (3.e5)' }, 'e4 e6 d4 d5 e5'),
    ],
  },
  // ---- nimzo-indian
  {
    id: 'nimzo-indian', side: 'b', eco: 'E20–E59', puzzles: 'nimzo-indian',
    name: { en: 'Nimzo-Indian Defence', es: 'Defensa Nimzoindia' },
    summary: {
      en: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 — pin the knight and fight for e4.',
      es: '1.d4 Cf6 2.c4 e6 3.Cc3 Ab4 — clavar el caballo y luchar por e4.',
    },
    intro: {
      en: [
        'The Nimzo-Indian stops e4 by pinning the c3-knight. Black is often willing to give the bishop for the knight (...Bxc3) to double White\'s c-pawns.',
        'White\'s main options are 4.e3 (Rubinstein), 4.Qc2 (Classical) and 4.a3 (Sämisch). Black has flexible plans with ...O-O, ...d5, ...c5 or ...b6.',
      ],
      es: [
        'La Nimzoindia impide e4 clavando el caballo de c3. Las negras suelen estar dispuestas a dar el alfil por el caballo (...Axc3) para doblar los peones c blancos.',
        'Las opciones principales de las blancas son 4.e3 (Rubinstein), 4.Dc2 (Clásica) y 4.a3 (Sämisch). Las negras tienen planes flexibles con ...O-O, ...d5, ...c5 o ...b6.',
      ],
    },
    structure: {
      en: 'After ...Bxc3 bxc3 White has the bishop pair and doubled c-pawns; Black blockades with ...c5, ...d6 and ...e5 and targets c4.',
      es: 'Tras ...Axc3 bxc3 las blancas tienen la pareja de alfiles y peones c doblados; las negras bloquean con ...c5, ...d6 y ...e5 y atacan c4.',
    },
    plans: {
      b: {
        en: ['...Bb4 and ...O-O, then ...d5 or ...c5.', 'Take on c3 when it doubles the pawns.', 'Control e4 with ...b6 and ...Bb7.'],
        es: ['...Ab4 y ...O-O, luego ...d5 o ...c5.', 'Tomar en c3 cuando doble los peones.', 'Controlar e4 con ...b6 y ...Ab7.'],
      },
      w: {
        en: ['Avoid doubled pawns with Qc2.', 'Use the bishop pair and open the position.', 'Build the centre with f3 and e4.'],
        es: ['Evitar los peones doblados con Dc2.', 'Aprovechar la pareja de alfiles y abrir la posición.', 'Montar el centro con f3 y e4.'],
      },
    },
    lines: [tree('nimzo-indian', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 Nf6 c4 e6 Nc3'),
      tree('nimzo-qc2', { en: 'Classical (4.Qc2)', es: 'Clásica (4.Dc2)' }, 'd4 Nf6 c4 e6 Nc3 Bb4 Qc2'),
    
      tree('nimzo-samisch', { en: 'Sämisch (4.a3)', es: 'Sämisch (4.a3)' }, 'd4 Nf6 c4 e6 Nc3 Bb4 a3'),
    ],
  },
  // ---- catalan
  {
    id: 'catalan', side: 'w', eco: 'E00–E09', puzzles: 'catalan',
    name: { en: 'Catalan Opening', es: 'Apertura Catalana' },
    summary: {
      en: '1.d4 Nf6 2.c4 e6 3.g3 — Queen\'s Gambit with a fianchettoed bishop pressing on the long diagonal.',
      es: '1.d4 Cf6 2.c4 e6 3.g3 — un Gambito de Dama con el alfil en fianchetto presionando la gran diagonal.',
    },
    intro: {
      en: [
        'The Catalan combines d4 and c4 with a kingside fianchetto. The g2-bishop pushes against Black\'s queenside along the long diagonal, especially after ...d5 and ...dxc4.',
        'If Black takes on c4, White often gives the pawn time and wins it back with Qa4+ or Qc2; if Black keeps the centre closed, White enjoys long-term pressure.',
      ],
      es: [
        'La Catalana combina d4 y c4 con un fianchetto en el flanco de rey. El alfil de g2 presiona el flanco de dama negro por la gran diagonal, sobre todo tras ...d5 y ...dxc4.',
        'Si las negras toman en c4, las blancas suelen tomarse su tiempo y recuperar el peón con Da4+ o Dc2; si las negras mantienen el centro cerrado, las blancas disfrutan de una presión duradera.',
      ],
    },
    structure: {
      en: 'Queen\'s Gambit structure (d4–c4 against d5–e6) with the bishop on g2. The b7 and c6 squares are the main targets; Black aims to free the game with ...c5 or ...e5.',
      es: 'Estructura de Gambito de Dama (d4–c4 contra d5–e6) con el alfil en g2. Las casillas b7 y c6 son los objetivos principales; las negras buscan liberarse con ...c5 o ...e5.',
    },
    plans: {
      w: {
        en: ['Bg2, Nf3, castle and press on the long diagonal.', 'Win back the c4-pawn with Qa4+ or Qc2.', 'Use the c-file and the outpost on c6 or e5.'],
        es: ['Ag2, Cf3, enroque y presión por la gran diagonal.', 'Recuperar el peón de c4 con Da4+ o Dc2.', 'Aprovechar la columna c y los puestos avanzados en c6 o e5.'],
      },
      b: {
        en: ['Take on c4 and try to keep it with ...b5 only when safe.', 'Free the game with ...c5 or ...e5.', 'Develop the c8-bishop to b7 or d7–c6 to fight the g2-bishop.'],
        es: ['Tomar en c4 e intentar conservarlo con ...b5 solo cuando sea seguro.', 'Liberarse con ...c5 o ...e5.', 'Desarrollar el alfil de c8 a b7 o d7–c6 para luchar contra el de g2.'],
      },
    },
    lines: [tree('catalan', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'd4 Nf6 c4 e6 g3')],
  },
  // ---- albin
  {
    id: 'albin', side: 'b', vs: 'd4', eco: 'D08–D09', puzzles: 'albin',
    name: { en: 'Albin Countergambit', es: 'Contragambito Albin' },
    summary: {
      en: '1.d4 d5 2.c4 e5 — Black answers the Queen\'s Gambit with a counter-gambit and a cramping pawn on d4.',
      es: '1.d4 d5 2.c4 e5 — las negras responden al Gambito de Dama con un contragambito y un peón incómodo en d4.',
    },
    intro: {
      en: [
        'Instead of defending d5, Black strikes back with 2...e5. After 3.dxe5 d4 the pawn on d4 cramps White, takes away c3 and e3 from White\'s pieces, and Black gets quick development with ...Nc6, ...Bg4 or ...Be6 and often long castling.',
        'It is a sharp surprise weapon full of traps — the most famous is the Lasker Trap, 4.e3? Bb4+ 5.Bd2 dxe3!, which ends with ...fxg1=N+. White\'s best setup is Nf3, g3, Bg2, O-O and Nbd2, attacking the d4-pawn.',
      ],
      es: [
        'En lugar de defender d5, las negras contraatacan con 2...e5. Tras 3.dxe5 d4 el peón de d4 encoge a las blancas, quita las casillas c3 y e3 a sus piezas, y las negras desarrollan rápido con ...Cc6, ...Ag4 o ...Ae6 y a menudo enroque largo.',
        'Es un arma sorpresa aguda y llena de trampas; la más famosa es la Trampa de Lasker, 4.e3? Ab4+ 5.Ad2 ¡dxe3!, que termina con ...fxg1=C+. El mejor esquema blanco es Cf3, g3, Ag2, O-O y Cbd2, atacando el peón de d4.',
      ],
    },
    structure: {
      en: 'Black\'s pawn on d4 against White\'s extra pawn on e5. Black wins the e5-pawn back with ...Nge7–g6 or ...Qe7, or keeps the gambit and attacks with long castling and ...h5–h4.',
      es: 'El peón negro de d4 frente al peón extra blanco de e5. Las negras recuperan el peón de e5 con ...Cge7–g6 o ...De7, o mantienen el gambito y atacan con enroque largo y ...h5–h4.',
    },
    plans: {
      b: {
        en: ['...d4 to cramp White, then ...Nc6 and ...Bg4 or ...Be6.', 'Castle long and attack with ...h5–h4 if White castles short.', 'Win back e5 with ...Nge7–g6 or ...Qe7.'],
        es: ['...d4 para encoger a las blancas, luego ...Cc6 y ...Ag4 o ...Ae6.', 'Enroque largo y ataque con ...h5–h4 si las blancas enrocan corto.', 'Recuperar e5 con ...Cge7–g6 o ...De7.'],
      },
      w: {
        en: ['Nf3, g3, Bg2 and O-O: the safest setup.', 'Nbd2–b3 to attack d4.', 'Avoid e3 early: it walks into the Lasker Trap.'],
        es: ['Cf3, g3, Ag2 y O-O: el esquema más seguro.', 'Cbd2–b3 para atacar d4.', 'Evitar e3 pronto: cae en la Trampa de Lasker.'],
      },
    },
    lines: [tree('albin', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 d5 c4 e5')],
  },
  // ---- colle
  {
    id: 'colle', side: 'w', eco: 'D04–D05', puzzles: 'colle',
    name: { en: 'Colle System', es: 'Sistema Colle' },
    summary: {
      en: '1.d4, Nf3, e3, Bd3, c3, Nbd2 and O-O — a solid system that prepares the central break e4.',
      es: '1.d4, Cf3, e3, Ad3, c3, Cbd2 y O-O: un sistema sólido que prepara la ruptura central e4.',
    },
    intro: {
      en: [
        'The Colle System is a set-up rather than a line: White builds a pyramid with c3, d4 and e3, puts the bishop on d3 aiming at h7, castles and then frees the game with e3–e4.',
        'It is easy to learn and leads to attacking positions against the black king. The Colle–Zukertort version (b3 and Bb2 instead of c3) is a close relative.',
      ],
      es: [
        'El Sistema Colle es un esquema más que una línea: las blancas montan una pirámide con c3, d4 y e3, ponen el alfil en d3 apuntando a h7, enrocan y luego liberan el juego con e3–e4.',
        'Es fácil de aprender y lleva a posiciones de ataque contra el rey negro. La versión Colle–Zukertort (b3 y Ab2 en lugar de c3) es una pariente cercana.',
      ],
    },
    structure: {
      en: 'Pawns on c3, d4 and e3 with the bishop on d3. The key break is e3–e4, usually prepared with Nbd2, Re1 and Qe2 or Qc2.',
      es: 'Peones en c3, d4 y e3 con el alfil en d3. La ruptura clave es e3–e4, normalmente preparada con Cbd2, Te1 y De2 o Dc2.',
    },
    plans: {
      w: {
        en: ['Nf3, e3, Bd3, c3, Nbd2 and O-O.', 'Prepare e4 with Re1 and Qe2 or Qc2.', 'After e4 opens the centre, attack the king with the d3-bishop and the knights.'],
        es: ['Cf3, e3, Ad3, c3, Cbd2 y O-O.', 'Preparar e4 con Te1 y De2 o Dc2.', 'Tras abrir el centro con e4, atacar al rey con el alfil de d3 y los caballos.'],
      },
      b: {
        en: ['Develop the c8-bishop before ...e6 (...Bf5 or ...Bg4).', 'Strike with ...c5 and ...Nc6.', 'Meet e4 by exchanging in the centre.'],
        es: ['Desarrollar el alfil de c8 antes de ...e6 (...Af5 o ...Ag4).', 'Golpear con ...c5 y ...Cc6.', 'Responder a e4 cambiando en el centro.'],
      },
    },
    lines: [tree('colle', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'd4')],
  },
  // ---- philidor
  {
    id: 'philidor', side: 'b', eco: 'C41', puzzles: 'philidor',
    name: { en: 'Philidor Defence', es: 'Defensa Philidor' },
    summary: {
      en: '1.e4 e5 2.Nf3 d6 — a solid defence of e5; in the classical line Black gives up the centre with ...exd4 and develops quickly.',
      es: '1.e4 e5 2.Cf3 d6: una defensa sólida de e5; en la línea clásica las negras ceden el centro con ...exd4 y desarrollan rápido.',
    },
    intro: {
      en: [
        'The Philidor defends e5 with the d-pawn. After 3.d4 Black can keep the centre (the Hanham setup, close to the Black Lion) or exchange with 3...exd4 and develop with ...Nf6, ...Be7 and ...O-O.',
        'It is solid but slightly passive; the key is to know the typical traps after 3.d4, where natural moves can drop material.',
      ],
      es: [
        'La Philidor defiende e5 con el peón d. Tras 3.d4 las negras pueden mantener el centro (el esquema Hanham, parecido al Black Lion) o cambiar con 3...exd4 y desarrollar con ...Cf6, ...Ae7 y ...O-O.',
        'Es sólida pero algo pasiva; la clave es conocer las trampas típicas tras 3.d4, donde jugadas naturales pueden perder material.',
      ],
    },
    structure: {
      en: 'After ...exd4 Black has a small but solid centre with the pawn on d6; White has more space. Black plays for ...Re8, ...Bf8 and ...d5 or ...c6 and ...d5.',
      es: 'Tras ...exd4 las negras tienen un centro pequeño pero sólido con el peón en d6; las blancas tienen más espacio. Las negras buscan ...Te8, ...Af8 y ...d5 o ...c6 y ...d5.',
    },
    plans: {
      b: {
        en: ['...exd4, ...Nf6, ...Be7 and ...O-O.', '...Re8 and ...Bf8 to pressure e4.', 'Free the game with ...d5 when it is safe.'],
        es: ['...exd4, ...Cf6, ...Ae7 y ...O-O.', '...Te8 y ...Af8 para presionar e4.', 'Liberar el juego con ...d5 cuando sea seguro.'],
      },
      w: {
        en: ['Take the centre with d4 and Nc3.', 'Use the extra space: f4 or Bf4 and Qd2 with long castling.', 'Watch for tricks on f7 with Bc4.'],
        es: ['Ocupar el centro con d4 y Cc3.', 'Aprovechar el espacio extra: f4 o Af4 y Dd2 con enroque largo.', 'Atención a los trucos sobre f7 con Ac4.'],
      },
    },
    lines: [tree('philidor', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'e4 e5 Nf3 d6')],
  },
  // ---- Open Games for Black (1...e5)
  {
    id: 'open-games-black', side: 'b', eco: 'C20–C99', puzzles: 'open-games-black',
    name: { en: 'Open Games with Black (1...e5)', es: 'Juegos abiertos con negras (1...e5)' },
    summary: {
      en: '1.e4 e5 — the classical answer: a repertoire against the Italian, the Ruy Lopez, the Scotch, the Vienna and the King\'s Gambit.',
      es: '1.e4 e5: la respuesta clásica. Un repertorio contra la Italiana, la Española, la Escocesa, la Viena y el Gambito de Rey.',
    },
    intro: {
      en: [
        '1...e5 fights for the centre directly and leads to open positions where development and king safety matter most.',
        'The repertoire: the Giuoco Piano (...Bc5) against the Italian, the Morphy Defence (...a6) against the Ruy Lopez, ...exd4 and quick development against the Scotch, ...Nf6 against the Vienna and accepting the King\'s Gambit.',
      ],
      es: [
        '1...e5 lucha por el centro directamente y lleva a posiciones abiertas donde lo más importante es el desarrollo y la seguridad del rey.',
        'El repertorio: el Giuoco Piano (...Ac5) contra la Italiana, la Defensa Morphy (...a6) contra la Española, ...exd4 y desarrollo rápido contra la Escocesa, ...Cf6 contra la Viena y aceptar el Gambito de Rey.',
      ],
    },
    structure: {
      en: 'Symmetrical or semi-open centre. Black keeps the e5-pawn as long as possible (...d6, ...Nc6) or exchanges it to free the pieces.',
      es: 'Centro simétrico o semiabierto. Las negras mantienen el peón de e5 todo lo posible (...d6, ...Cc6) o lo cambian para liberar las piezas.',
    },
    plans: {
      b: {
        en: ['Develop quickly and castle: knights before bishops, no early queen moves.', 'Hold e5 with ...d6 or ...Nc6; strike with ...d5 when it is safe.', 'Watch f7 (and f2 tricks) in the first moves.'],
        es: ['Desarrollar rápido y enrocar: caballos antes que alfiles, sin sacar la dama pronto.', 'Sostener e5 con ...d6 o ...Cc6; golpear con ...d5 cuando sea seguro.', 'Vigilar f7 (y los trucos sobre f2) en las primeras jugadas.'],
      },
      w: {
        en: ['Build the centre with c3 and d4.', 'Pressure f7 and e5.', 'Gain space with a4, b4 or f4 depending on the line.'],
        es: ['Construir el centro con c3 y d4.', 'Presionar f7 y e5.', 'Ganar espacio con a4, b4 o f4 según la línea.'],
      },
    },
    lines: [
      tree('eb-italian', { en: 'Against the Italian (3.Bc4)', es: 'Contra la Italiana (3.Ac4)' }, 'e4 e5 Nf3 Nc6 Bc4'),
      tree('eb-ruy', { en: 'Against the Ruy Lopez (3.Bb5)', es: 'Contra la Española (3.Ab5)' }, 'e4 e5 Nf3 Nc6 Bb5'),
      tree('eb-scotch', { en: 'Against the Scotch (3.d4)', es: 'Contra la Escocesa (3.d4)' }, 'e4 e5 Nf3 Nc6 d4'),
      tree('eb-vienna', { en: 'Against the Vienna (2.Nc3)', es: 'Contra la Viena (2.Cc3)' }, 'e4 e5 Nc3'),
      tree('eb-kings-gambit', { en: 'Against the King\'s Gambit (2.f4)', es: 'Contra el Gambito de Rey (2.f4)' }, 'e4 e5 f4'),
    
      tree('eb-ponziani', { en: 'Against the Ponziani (3.c3)', es: 'Contra la Ponziani (3.c3)' }, 'e4 e5 Nf3 Nc6 c3'),
    
      tree('eb-four-knights', { en: 'Against the Four Knights (3.Nc3)', es: 'Contra los Cuatro Caballos (3.Cc3)' }, 'e4 e5 Nf3 Nc6 Nc3'),
    
      tree('eb-danish', { en: 'Against the Centre Game and Danish Gambit (2.d4)', es: 'Contra el Centro y el Gambito Danés (2.d4)' }, 'e4 e5 d4'),
    
      tree('eb-bishops', { en: 'Against the Bishop\'s Opening (2.Bc4)', es: 'Contra la Apertura de Alfil (2.Ac4)' }, 'e4 e5 Bc4'),
    ],
  },
  // ---- Against the London
  {
    id: 'vs-london', side: 'b', vs: 'd4', eco: 'D00–D05, A45', puzzles: 'vs-london',
    name: { en: 'Against the 1.d4 systems', es: 'Contra los sistemas de 1.d4' },
    summary: {
      en: 'When White plays 1.d4 without c4: the London, the Trompowsky, the Colle, the Jobava London and the Blackmar-Diemer Gambit.',
      es: 'Cuando las blancas juegan 1.d4 sin c4: la London, el Trompowsky, el Colle, la London Jobava y el Gambito Blackmar-Diemer.',
    },
    intro: {
      en: [
        'The London is very popular at club level because White plays the same moves every game. The best answer is to strike at once.',
        'With ...c5 and ...Nc6, and ...Qb6 when the bishop has left c1, Black puts immediate pressure on d4 and b2.',
      ],
      es: [
        'La London es muy popular en club porque las blancas juegan siempre las mismas jugadas. La mejor respuesta es golpear de inmediato.',
        'Con ...c5 y ...Cc6, y ...Db6 cuando el alfil ha salido de c1, las negras presionan enseguida d4 y b2.',
      ],
    },
    structure: {
      en: 'White builds the pyramid c3–d4–e3; Black fights it with ...c5 and pressure on the dark squares.',
      es: 'Las blancas construyen la pirámide c3–d4–e3; las negras la combaten con ...c5 y presión en las casillas negras.',
    },
    plans: {
      b: {
        en: ['...c5 and ...Nc6 against d4.', '...Qb6 when b2 is weak.', '...Bd6 to trade the strong f4-bishop.'],
        es: ['...c5 y ...Cc6 contra d4.', '...Db6 cuando b2 esté débil.', '...Ad6 para cambiar el fuerte alfil de f4.'],
      },
      w: {
        en: ['e3, c3, Nd2, Bd3 and Ngf3: the solid pyramid.', 'Qb3 to answer ...Qb6.', 'Ne5 and a kingside attack.'],
        es: ['e3, c3, Cd2, Ad3 y Cgf3: la pirámide sólida.', 'Db3 para contestar a ...Db6.', 'Ce5 y ataque en el flanco de rey.'],
      },
    },
    lines: [tree('vs-london', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 d5 Bf4'),
      tree('vs-trompowsky', { en: 'Against the Trompowsky (2.Bg5)', es: 'Contra el Trompowsky (2.Ag5)' }, 'd4 Nf6 Bg5'),
    
      tree('vs-colle', { en: 'Against the Colle (e3, Bd3)', es: 'Contra el Colle (e3, Ad3)' }, 'd4 d5 Nf3 Nf6 e3'),
    
      tree('vs-jobava', { en: 'Against the Jobava London (2.Nc3)', es: 'Contra la London Jobava (2.Cc3)' }, 'd4 d5 Nc3'),
    
      tree('vs-bdg', { en: 'Against the Blackmar-Diemer Gambit (2.e4)', es: 'Contra el Gambito Blackmar-Diemer (2.e4)' }, 'd4 d5 e4'),
    ],
  },
  // ---- Semi-Slav
  {
    id: 'semi-slav', side: 'b', vs: 'd4', eco: 'D43–D49', puzzles: 'semi-slav',
    name: { en: 'Semi-Slav Defence', es: 'Defensa Semieslava' },
    summary: {
      en: '1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 e6 — the solid triangle c6–d5–e6 with dynamic options like the Meran (...dxc4 and ...b5).',
      es: '1.d4 d5 2.c4 c6 3.Cf3 Cf6 4.Cc3 e6: el sólido triángulo c6–d5–e6 con opciones dinámicas como la Merano (...dxc4 y ...b5).',
    },
    intro: {
      en: [
        'The Semi-Slav combines the Slav (...c6) with the Queen\'s Gambit Declined (...e6). It is very solid, but Black keeps the option of taking on c4 and expanding with ...b5.',
        'The main idea of the Meran: ...dxc4, ...b5, ...Bb7, ...a6 and the freeing break ...c5.',
      ],
      es: [
        'La Semieslava combina la Eslava (...c6) con el Gambito de Dama Rehusado (...e6). Es muy sólida, pero las negras conservan la opción de tomar en c4 y expandirse con ...b5.',
        'La idea principal de la Merano: ...dxc4, ...b5, ...Ab7, ...a6 y la ruptura liberadora ...c5.',
      ],
    },
    structure: {
      en: 'The triangle c6–d5–e6 shuts the c8-bishop in; Black frees it with ...dxc4 and ...b5–Bb7, or with ...e5.',
      es: 'El triángulo c6–d5–e6 encierra al alfil de c8; las negras lo liberan con ...dxc4 y ...b5–Ab7, o con ...e5.',
    },
    plans: {
      b: {
        en: ['...Nbd7 and ...Bd6.', 'After e3 and Bd3: ...dxc4, ...b5, ...Bb7 and ...c5.', '...e5 when White plays slowly.'],
        es: ['...Cbd7 y ...Ad6.', 'Tras e3 y Ad3: ...dxc4, ...b5, ...Ab7 y ...c5.', '...e5 cuando las blancas juegan con calma.'],
      },
      w: {
        en: ['e3 and Bd3, or the sharp Bg5.', 'e4 in the centre when possible.', 'Qc2 to prevent ...dxc4 lines.'],
        es: ['e3 y Ad3, o la aguda Ag5.', 'e4 en el centro cuando sea posible.', 'Dc2 para evitar las líneas de ...dxc4.'],
      },
    },
    lines: [tree('semi-slav', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6')],
  },
  // ---- Modern Defence
  {
    id: 'modern', side: 'b', eco: 'B06', puzzles: 'modern',
    name: { en: 'Modern Defence', es: 'Defensa Moderna' },
    summary: {
      en: '1.e4 g6 — Black fianchettoes first and lets White build a centre, to attack it later.',
      es: '1.e4 g6: las negras hacen primero el fianchetto y dejan que las blancas construyan un centro, para atacarlo después.',
    },
    intro: {
      en: [
        'Close to the Pirc, but Black delays ...Nf6, keeping options like ...c6 and ...d5 or ...a6 and ...b5.',
        'The g7-bishop is the soul of the opening: it presses on d4 and the long diagonal.',
      ],
      es: [
        'Parecida a la Pirc, pero las negras retrasan ...Cf6, manteniendo opciones como ...c6 y ...d5 o ...a6 y ...b5.',
        'El alfil de g7 es el alma de la apertura: presiona d4 y la gran diagonal.',
      ],
    },
    structure: {
      en: 'White has the big centre (e4–d4); Black has a flexible setup g6–d6 and strikes back with ...c5, ...e5 or ...d5.',
      es: 'Las blancas tienen el gran centro (e4–d4); las negras un esquema flexible g6–d6 y contraatacan con ...c5, ...e5 o ...d5.',
    },
    plans: {
      b: {
        en: ['...Bg7, ...d6, then decide: ...c6 and ...d5, or ...a6 and ...b5.', 'Challenge the centre with ...c5 or ...e5.', 'Do not fall behind in development.'],
        es: ['...Ag7, ...d6, y después decidir: ...c6 y ...d5, o ...a6 y ...b5.', 'Desafiar el centro con ...c5 o ...e5.', 'No quedarse atrás en desarrollo.'],
      },
      w: {
        en: ['Keep the big centre and develop naturally.', 'Be3, Qd2 and Bh6 to trade the g7-bishop.', 'f4 and e5 against slow play.'],
        es: ['Mantener el gran centro y desarrollar con naturalidad.', 'Ae3, Dd2 y Ah6 para cambiar el alfil de g7.', 'f4 y e5 contra el juego lento.'],
      },
    },
    lines: [tree('modern', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'e4 g6')],
  },
  // ---- QGA for Black
  {
    id: 'qga-black', side: 'b', vs: 'd4', eco: 'D20–D29', puzzles: 'qga-black',
    name: { en: 'Queen\'s Gambit Accepted', es: 'Gambito de Dama Aceptado' },
    summary: {
      en: '1.d4 d5 2.c4 dxc4 — Black takes the pawn, does not try to keep it, and uses the time for ...Nf6, ...e6 and ...c5.',
      es: '1.d4 d5 2.c4 dxc4: las negras toman el peón, no intentan conservarlo, y usan el tiempo para ...Cf6, ...e6 y ...c5.',
    },
    intro: {
      en: [
        'The classical idea: give back the pawn and attack White\'s centre with ...c5. White gets an isolated d-pawn in many lines.',
        'Trying to keep the pawn with ...b5 is the classic beginner\'s mistake: a4 and Qf3 or Qa4+ punish it.',
      ],
      es: [
        'La idea clásica: devolver el peón y atacar el centro blanco con ...c5. En muchas líneas las blancas se quedan con el peón d aislado.',
        'Intentar conservar el peón con ...b5 es el error clásico del principiante: a4 y Df3 o Da4+ lo castigan.',
      ],
    },
    structure: {
      en: 'After ...c5 and cxd4 exd4, White often has an isolated d4-pawn: Black blockades on d5 and trades pieces.',
      es: 'Tras ...c5 y cxd4 exd4, las blancas suelen tener un peón aislado en d4: las negras bloquean en d5 y cambian piezas.',
    },
    plans: {
      b: {
        en: ['...Nf6, ...e6, ...c5 and ...a6.', 'Blockade an isolated pawn on d5.', 'Do not cling to the c4-pawn.'],
        es: ['...Cf6, ...e6, ...c5 y ...a6.', 'Bloquear un peón aislado en d5.', 'No aferrarse al peón de c4.'],
      },
      w: {
        en: ['e3 and Bxc4, or e4 at once.', 'Use the extra space and the centre.', 'Play for d5 with an isolated pawn.'],
        es: ['e3 y Axc4, o e4 de inmediato.', 'Aprovechar el espacio extra y el centro.', 'Buscar d5 con el peón aislado.'],
      },
    },
    lines: [tree('qga-black', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 d5 c4 dxc4')],
  },
  // ---- Against the English
  {
    id: 'vs-english', side: 'b', eco: 'A20–A29', puzzles: 'vs-english',
    name: { en: 'Against the English (1...e5)', es: 'Contra la Inglesa (1...e5)' },
    summary: {
      en: '1.c4 e5 — a reversed Sicilian: Black takes the centre and develops with ...Nf6, ...Nc6 and ...Bb4 or ...d5.',
      es: '1.c4 e5: una Siciliana invertida. Las negras toman el centro y desarrollan con ...Cf6, ...Cc6 y ...Ab4 o ...d5.',
    },
    intro: {
      en: [
        'Against 1.c4 the simplest plan is to occupy the centre with ...e5. White usually fianchettoes (g3, Bg2) and fights for d5.',
        'Black develops naturally and chooses between ...d5, ...Bb4 or a King\'s Indian setup with ...g6.',
      ],
      es: [
        'Contra 1.c4 el plan más sencillo es ocupar el centro con ...e5. Las blancas suelen hacer el fianchetto (g3, Ag2) y luchan por d5.',
        'Las negras desarrollan con naturalidad y eligen entre ...d5, ...Ab4 o un esquema india de rey con ...g6.',
      ],
    },
    structure: {
      en: 'Black\'s e5-pawn against White\'s c4: the fight is for d5 and d4.',
      es: 'El peón negro de e5 contra el blanco de c4: la lucha es por d5 y d4.',
    },
    plans: {
      b: {
        en: ['...Nf6, ...Nc6, ...Bb4 or ...Bc5.', '...d5 when White allows it.', 'Kingside space with ...f5 in closed lines.'],
        es: ['...Cf6, ...Cc6, ...Ab4 o ...Ac5.', '...d5 cuando las blancas lo permitan.', 'Espacio en el flanco de rey con ...f5 en las líneas cerradas.'],
      },
      w: {
        en: ['g3, Bg2, Nc3: control of d5.', 'Queenside expansion with a3, b4.', 'd3 and a slow build-up.'],
        es: ['g3, Ag2, Cc3: control de d5.', 'Expansión en el flanco de dama con a3, b4.', 'd3 y una construcción lenta.'],
      },
    },
    lines: [tree('vs-english', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'c4')],
  },
  // ---- Bogo-Indian
  {
    id: 'bogo-indian', side: 'b', vs: 'd4', eco: 'E11', puzzles: 'bogo-indian',
    name: { en: 'Bogo-Indian Defence', es: 'Defensa Bogo-India' },
    summary: {
      en: '1.d4 Nf6 2.c4 e6 3.Nf3 Bb4+ — a simple, solid check that develops with tempo when White avoids the Nimzo-Indian.',
      es: '1.d4 Cf6 2.c4 e6 3.Cf3 Ab4+: un jaque sencillo y sólido que desarrolla con tiempo cuando las blancas evitan la Nimzo-India.',
    },
    intro: {
      en: [
        'When White plays 3.Nf3 instead of 3.Nc3, the Bogo-Indian gives the check anyway. After Bd2 Black chooses between ...Qe7, ...Be7 or trading on d2.',
        'It is a calm opening: easy development and a solid position.',
      ],
      es: [
        'Cuando las blancas juegan 3.Cf3 en lugar de 3.Cc3, la Bogo-India da el jaque igualmente. Tras Ad2 las negras eligen entre ...De7, ...Ae7 o cambiar en d2.',
        'Es una apertura tranquila: desarrollo fácil y posición sólida.',
      ],
    },
    structure: {
      en: 'Black often trades the dark-squared bishop and puts the pawns on dark squares (...d6, ...e5) or plays ...d5.',
      es: 'Las negras suelen cambiar el alfil de casillas negras y poner los peones en casillas negras (...d6, ...e5) o juegan ...d5.',
    },
    plans: {
      b: {
        en: ['...Qe7 keeps the bishop; ...Bxd2+ simplifies.', '...O-O, ...d6 and ...e5, or ...d5.', 'Use the fianchetto ...b6–Bb7 in some lines.'],
        es: ['...De7 conserva el alfil; ...Axd2+ simplifica.', '...O-O, ...d6 y ...e5, o ...d5.', 'Usar el fianchetto ...b6–Ab7 en algunas líneas.'],
      },
      w: {
        en: ['Bd2 or Nbd2 against the check.', 'g3 and Bg2: a Catalan-style setup.', 'Gain space in the centre with e4.'],
        es: ['Ad2 o Cbd2 contra el jaque.', 'g3 y Ag2: un esquema tipo Catalana.', 'Ganar espacio en el centro con e4.'],
      },
    },
    lines: [tree('bogo-indian', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'd4 Nf6 c4 e6 Nf3 Bb4+')],
  },
  // ---- Reti
  {
    id: 'reti', side: 'w', eco: 'A04–A09', puzzles: 'reti',
    name: { en: 'Réti Opening', es: 'Apertura Réti' },
    summary: {
      en: '1.Nf3 and c4 — a hypermodern opening: White attacks the centre from the flanks with c4 and fianchettoed bishops.',
      es: '1.Cf3 y c4: una apertura hipermoderna. Las blancas atacan el centro desde los flancos con c4 y alfiles en fianchetto.',
    },
    intro: {
      en: [
        'Richard Réti\'s idea: do not occupy the centre with pawns at once; control it with pieces and strike at it with c4.',
        'Flexible and positional: it often transposes to the English, the Catalan or the Queen\'s Gambit.',
      ],
      es: [
        'La idea de Richard Réti: no ocupar el centro con peones de inmediato; controlarlo con piezas y golpearlo con c4.',
        'Flexible y posicional: a menudo transpone a la Inglesa, la Catalana o el Gambito de Dama.',
      ],
    },
    structure: {
      en: 'White\'s c4 against Black\'s d5; the bishops on g2 (and b2) aim at the centre.',
      es: 'El c4 blanco contra el d5 negro; los alfiles de g2 (y b2) apuntan al centro.',
    },
    plans: {
      w: {
        en: ['Nf3, c4, g3, Bg2 and O-O.', 'b3 and Bb2 for a double fianchetto.', 'Pressure d5; play d4 at the right moment.'],
        es: ['Cf3, c4, g3, Ag2 y O-O.', 'b3 y Ab2 para un doble fianchetto.', 'Presionar d5; jugar d4 en el momento oportuno.'],
      },
      b: {
        en: ['A solid ...d5–c6 setup.', '...d4 to gain space.', 'Develop the c8-bishop early.'],
        es: ['Un esquema sólido ...d5–c6.', '...d4 para ganar espacio.', 'Desarrollar pronto el alfil de c8.'],
      },
    },
    lines: [tree('reti', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'Nf3')],
  },
  // ---- Trompowsky
  {
    id: 'trompowsky', side: 'w', eco: 'A45', puzzles: 'trompowsky',
    name: { en: 'Trompowsky Attack', es: 'Ataque Trompowsky' },
    summary: {
      en: '1.d4 Nf6 2.Bg5 — White threatens to double Black\'s pawns at once and avoids the big Indian theory.',
      es: '1.d4 Cf6 2.Ag5: las blancas amenazan doblar los peones negros de inmediato y evitan la gran teoría india.',
    },
    intro: {
      en: [
        'After 2.Bg5 Black must decide at once: allow Bxf6, play ...Ne4, or ...e6 and ...d5.',
        'White often gives the bishop for the knight to get a strong centre with e3/e4 and c3.',
      ],
      es: [
        'Tras 2.Ag5 las negras deben decidir enseguida: permitir Axf6, jugar ...Ce4, o ...e6 y ...d5.',
        'Las blancas a menudo entregan el alfil por el caballo para conseguir un centro fuerte con e3/e4 y c3.',
      ],
    },
    structure: {
      en: 'After Bxf6, Black has the bishop pair and doubled pawns; White has a lead in development and the centre.',
      es: 'Tras Axf6, las negras tienen la pareja de alfiles y peones doblados; las blancas, ventaja en desarrollo y el centro.',
    },
    plans: {
      w: {
        en: ['Bxf6 when it damages the structure.', 'Against ...Ne4: Bf4 or Bh4 and f3.', 'e3, c3, Nd2 and a solid centre.'],
        es: ['Axf6 cuando daña la estructura.', 'Contra ...Ce4: Af4 o Ah4 y f3.', 'e3, c3, Cd2 y un centro sólido.'],
      },
      b: {
        en: ['...Ne4 hitting the bishop.', '...c5 and ...Qb6 against b2.', '...e6 and ...d5: solid.'],
        es: ['...Ce4 atacando el alfil.', '...c5 y ...Db6 contra b2.', '...e6 y ...d5: sólido.'],
      },
    },
    lines: [tree('trompowsky', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'd4 Nf6 Bg5')],
  },
  // ---- Against the Reti
  {
    id: 'vs-reti', side: 'b', eco: 'A04–A09', puzzles: 'vs-reti',
    name: { en: 'Against 1.Nf3 (Réti)', es: 'Contra 1.Cf3 (Réti)' },
    summary: {
      en: '1.Nf3 d5 — a classical setup: ...d5, ...Nf6, ...c6 and ...Bg4 or ...Bf5, developing the light-squared bishop before ...e6.',
      es: '1.Cf3 d5: un esquema clásico. ...d5, ...Cf6, ...c6 y ...Ag4 o ...Af5, desarrollando el alfil de casillas blancas antes de ...e6.',
    },
    intro: {
      en: [
        '1.Nf3 is flexible and can transpose to many openings. A simple, solid answer is the Slav-style setup with ...d5 and ...c6.',
        'The key is the c8-bishop: develop it to f5 or g4 before closing it in with ...e6.',
      ],
      es: [
        '1.Cf3 es flexible y puede transponer a muchas aperturas. Una respuesta sencilla y sólida es el esquema tipo Eslava con ...d5 y ...c6.',
        'La clave es el alfil de c8: desarrollarlo a f5 o g4 antes de encerrarlo con ...e6.',
      ],
    },
    structure: {
      en: 'Black holds d5 with ...c6 and ...e6; White attacks it with c4 and a fianchetto.',
      es: 'Las negras sostienen d5 con ...c6 y ...e6; las blancas lo atacan con c4 y un fianchetto.',
    },
    plans: {
      b: {
        en: ['...d5, ...Nf6, ...c6.', '...Bg4 or ...Bf5, then ...e6 and ...Nbd7.', 'Keep d5 solid against c4.'],
        es: ['...d5, ...Cf6, ...c6.', '...Ag4 o ...Af5, después ...e6 y ...Cbd7.', 'Mantener d5 sólido frente a c4.'],
      },
      w: {
        en: ['c4 and g3 with Bg2.', 'b3 and Bb2: a double fianchetto.', 'Transpose to a Catalan or an English.'],
        es: ['c4 y g3 con Ag2.', 'b3 y Ab2: un doble fianchetto.', 'Transponer a una Catalana o una Inglesa.'],
      },
    },
    lines: [tree('vs-reti', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'Nf3')],
  },
  // ---- Jobava London
  {
    id: 'jobava', side: 'w', eco: 'D00, A45', puzzles: 'jobava',
    name: { en: 'Jobava London (Rapport–Jobava)', es: 'London Jobava (Rapport–Jobava)' },
    summary: {
      en: '1.d4 with Nc3 and Bf4 — an aggressive version of the London: the knight jumps to b5 and White often castles long.',
      es: '1.d4 con Cc3 y Af4: una versión agresiva de la London. El caballo salta a b5 y las blancas a menudo enrocan largo.',
    },
    intro: {
      en: [
        'Instead of the slow c3–e3 pyramid, White puts the knight on c3, threatening Nb5 and c7.',
        'Sharp and practical: plans with Qd2, O-O-O and f3–g4 are common.',
      ],
      es: [
        'En lugar de la lenta pirámide c3–e3, las blancas ponen el caballo en c3, amenazando Cb5 y c7.',
        'Aguda y práctica: son habituales los planes con Dd2, O-O-O y f3–g4.',
      ],
    },
    structure: {
      en: 'Pawns d4–e3 with the knight on c3 (blocking the c-pawn); the f4-bishop and Nb5 aim at c7.',
      es: 'Peones d4–e3 con el caballo en c3 (tapando el peón c); el alfil de f4 y Cb5 apuntan a c7.',
    },
    plans: {
      w: {
        en: ['Nc3 and Bf4, then e3.', 'Nb5 against c7 when Black is careless.', 'Qd2, O-O-O and a kingside pawn storm.'],
        es: ['Cc3 y Af4, después e3.', 'Cb5 contra c7 si las negras se descuidan.', 'Dd2, O-O-O y avalancha de peones en el flanco de rey.'],
      },
      b: {
        en: ['...a6 or ...c6 to cover b5.', '...c5 against d4.', '...Bd6 to trade the f4-bishop.'],
        es: ['...a6 o ...c6 para cubrir b5.', '...c5 contra d4.', '...Ad6 para cambiar el alfil de f4.'],
      },
    },
    lines: [tree('jobava', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'd4')],
  },
];
