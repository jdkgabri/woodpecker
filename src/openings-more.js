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
    lines: [tree('alapin', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 c5')],
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
    lines: [tree('vienna', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'e4 e5 Nc3')],
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
    lines: [tree('english', { en: 'All of Black\'s replies', es: 'Todas las respuestas negras' }, 'c4')],
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
    lines: [tree('caro-kann', { en: 'All of White\'s tries', es: 'Todos los intentos blancos' }, 'e4 c6')],
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
];
