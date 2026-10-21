// Main lines of the tree-only lines: the most played reply at every step, answered with the tree's move,
// with a move-by-move explanation (keys are ply numbers counted from the initial position, as in openings-data.js).
// A line listed here gets Study and Practise besides Explore and Practise branches.
// main-lines-more.js holds the rest, in the same format (written with tools, merged below).
import MORE from './main-lines-more.js';
const CARO_START = {
  2: { en: '1...c6 prepares ...d5 with the c-pawn behind it: if White ever takes on d5, Black recaptures with a pawn and keeps a foothold in the centre.', es: '1...c6 prepara ...d5 con el peón c detrás: si las blancas toman en d5, las negras recapturan con un peón y mantienen presencia en el centro.' },
  4: { en: 'The point of the Caro-Kann: Black challenges e4 at once. White has to choose: defend it, exchange on d5 or advance with e5.', es: 'La idea de la Caro-Kann: las negras desafían e4 de inmediato. Las blancas deben elegir: defenderlo, cambiar en d5 o avanzar con e5.' },
};
const CARO_ADVANCE = {
  ...CARO_START,
  5: { en: 'The Advance Variation, the most popular choice at club level: White gains space and takes the f6-square away from Black\'s knight.', es: 'La Variante del Avance, la más popular en club: las blancas ganan espacio y le quitan la casilla f6 al caballo negro.' },
  6: { en: 'The key difference from the French: the light-squared bishop comes out BEFORE ...e6 shuts it in.', es: 'La gran diferencia con la Francesa: el alfil de casillas blancas sale ANTES de que ...e6 lo encierre.' },
  7: { en: 'The calm "short system": White develops and supports d4. Sharper tries are 4.Nc3 with g4, or 4.h4.', es: 'El tranquilo "sistema corto": las blancas desarrollan y apoyan d4. Intentos más agudos son 4.Cc3 con g4, o 4.h4.' },
  8: { en: 'Now ...e6 is safe because the bishop is already outside the chain. Black\'s plan: ...c5 to hit the base of White\'s chain, d4.', es: 'Ahora ...e6 es seguro porque el alfil ya está fuera de la cadena. El plan negro: ...c5 para atacar la base de la cadena blanca, d4.' },
};

export const MAIN_LINES = {
  'caro-kann': {
    moves: 'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Bd3 Bxd3 Qxd3 Nd7 O-O c5',
    notes: {
      ...CARO_ADVANCE,
      9: { en: 'White offers to trade the bishops: Black\'s bishop is the good one, so White wants it off the board.', es: 'Las blancas ofrecen cambiar los alfiles: el alfil negro es el bueno, así que las blancas quieren eliminarlo.' },
      10: { en: 'Accepting is simple: after the trade Black has no "bad bishop" problem at all, and White\'s queen has spent a move recapturing.', es: 'Aceptar es sencillo: tras el cambio las negras no tienen ningún problema de "alfil malo", y la dama blanca gasta una jugada en recapturar.' },
      12: { en: 'A flexible move: the knight supports ...c5 and can go to b6. The other knight will come out via e7 (to f5 or c6), because f6 is controlled by the e5-pawn.', es: 'Una jugada flexible: el caballo apoya ...c5 y puede ir a b6. El otro caballo saldrá por e7 (hacia f5 o c6), porque f6 está controlada por el peón de e5.' },
      13: { en: 'White castles and will support the centre with c3, Nbd2 and Re1.', es: 'Las blancas enrocan y sostendrán el centro con c3, Cbd2 y Te1.' },
      14: { en: 'The thematic break: Black attacks d4. Next come ...Ne7, ...Nc6 or ...Nf5, and ...Qb6. Black has a solid and comfortable position.', es: 'La ruptura temática: las negras atacan d4. Siguen ...Ce7, ...Cc6 o ...Cf5, y ...Db6. Las negras tienen una posición sólida y cómoda.' },
    },
  },
  'caro-advance-black': {
    moves: 'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Bd3 Ne7 O-O Nd7 Bg5 Qb6',
    notes: {
      ...CARO_ADVANCE,
      9: { en: 'White offers to trade the bishops.', es: 'Las blancas ofrecen cambiar los alfiles.' },
      10: { en: '...Ne7 supports f5: if Bxf5, ...Nxf5 and the knight is excellent on f5, pressing on d4.', es: '...Ce7 apoya f5: si Axf5, ...Cxf5 y el caballo es excelente en f5, presionando d4.' },
      12: { en: '...Nd7 prepares ...c5 and keeps the position compact.', es: '...Cd7 prepara ...c5 y mantiene la posición compacta.' },
      13: { en: 'Bg5 hits the e7-knight and tries to disturb Black\'s development.', es: 'Ag5 ataca el caballo de e7 e intenta molestar el desarrollo negro.' },
      14: { en: '...Qb6 attacks b2 and d4 at the same time: the typical counterplay against the base of White\'s chain. ...c5 comes next.', es: '...Db6 ataca a la vez b2 y d4: el contrajuego típico contra la base de la cadena blanca. Después llega ...c5.' },
    },
  },
  'caro-classical': {
    moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 Nf3 Nd7 h4 h6 h5 Bh7 Bd3 Ngf6 Bxh7 Nxh7 Bf4 e6',
    notes: {
      ...CARO_START,
      5: { en: 'The main line: White defends e4 with a piece.', es: 'La línea principal: las blancas defienden e4 con una pieza.' },
      6: { en: 'Black gives up the centre to develop the light-squared bishop actively in the next move.', es: 'Las negras ceden el centro para desarrollar activamente el alfil de casillas blancas en la jugada siguiente.' },
      8: { en: 'The Classical Variation: the bishop comes out with tempo, attacking the e4-knight.', es: 'La Variante Clásica: el alfil sale ganando tiempo, atacando el caballo de e4.' },
      9: { en: 'The knight steps back and attacks the bishop in turn.', es: 'El caballo se retira y ataca a su vez al alfil.' },
      10: { en: 'The bishop stays on its good diagonal, b1–h7.', es: 'El alfil se queda en su buena diagonal, b1–h7.' },
      12: { en: '...Nd7 before ...Ngf6 controls e5, so a later Ne5 can be met by ...Nxe5.', es: '...Cd7 antes de ...Cgf6 controla e5, así que un futuro Ce5 se puede contestar con ...Cxe5.' },
      13: { en: 'The typical gain of space: h4–h5 threatens to trap or chase the bishop.', es: 'La típica ganancia de espacio: h4–h5 amenaza atrapar o perseguir al alfil.' },
      14: { en: '...h6 prepares a safe retreat on h7 for the bishop.', es: '...h6 prepara una retirada segura en h7 para el alfil.' },
      15: { en: 'h5 gains space on the kingside, but the pawn can become a target later.', es: 'h5 gana espacio en el flanco de rey, pero el peón puede convertirse en un objetivo más adelante.' },
      16: { en: 'The bishop retreats and keeps the b1–h7 diagonal.', es: 'El alfil se retira y conserva la diagonal b1–h7.' },
      17: { en: 'White offers the trade of the light-squared bishops.', es: 'Las blancas ofrecen el cambio de los alfiles de casillas blancas.' },
      18: { en: 'Black finishes developing the knights; after the trade the other knight recaptures on h7.', es: 'Las negras completan el desarrollo de los caballos; tras el cambio el otro caballo recaptura en h7.' },
      20: { en: 'The knight will come back to f6 (via ...Nhf6) or to g5.', es: 'El caballo volverá a f6 (vía ...Chf6) o irá a g5.' },
      21: { en: 'The bishop takes the b8–h2 diagonal and controls e5. Qe2 and long castling often follow.', es: 'El alfil ocupa la diagonal b8–h2 y controla e5. Suelen seguir De2 y el enroque largo.' },
      22: { en: 'Black is very solid: ...Be7 or ...Bd6, ...Qa5 or ...Qc7 and castling (often long). A sound structure with no weaknesses.', es: 'Las negras están muy sólidas: ...Ae7 o ...Ad6, ...Da5 o ...Dc7 y enroque (a menudo largo). Una estructura sana y sin debilidades.' },
    },
  },
  'caro-panov': {
    moves: 'e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Be7 cxd5 Nxd5 Bd3 Nf6 O-O Nc6 Re1 O-O',
    notes: {
      ...CARO_START,
      5: { en: 'The Exchange Variation.', es: 'La Variante del Cambio.' },
      6: { en: 'Recapture with the c-pawn: the centre is symmetrical for now.', es: 'Recaptura con el peón c: de momento el centro es simétrico.' },
      7: { en: 'The Panov–Botvinnik Attack: White accepts an isolated d-pawn in exchange for active pieces and attacking chances.', es: 'El Ataque Panov–Botvinnik: las blancas aceptan un peón d aislado a cambio de piezas activas y posibilidades de ataque.' },
      8: { en: '...Nf6 develops and adds pressure on d5.', es: '...Cf6 desarrolla y suma presión sobre d5.' },
      10: { en: '...e6 keeps everything solid: the position resembles a Queen\'s Gambit with an isolated pawn.', es: '...e6 lo mantiene todo sólido: la posición se parece a un Gambito de Dama con peón aislado.' },
      12: { en: 'Quiet development: Black will castle and then deal with the centre.', es: 'Desarrollo tranquilo: las negras enrocarán y después se ocuparán del centro.' },
      13: { en: 'White releases the tension: d4 is now an isolated pawn.', es: 'Las blancas liberan la tensión: d4 es ya un peón aislado.' },
      14: { en: 'The knight on d5 is the ideal blockader, right in front of the isolated pawn.', es: 'El caballo de d5 es el bloqueador ideal, justo delante del peón aislado.' },
      15: { en: 'The bishop aims at h7, the typical attacking diagonal in these positions.', es: 'El alfil apunta a h7, la diagonal de ataque típica en estas posiciones.' },
      16: { en: 'The knight returns to f6 to protect the king against the battery Bd3 + Qc2 on h7.', es: 'El caballo vuelve a f6 para proteger al rey contra la batería Ad3 + Dc2 sobre h7.' },
      18: { en: '...Nc6 adds pressure on d4.', es: '...Cc6 suma presión sobre d4.' },
      20: { en: 'A comfortable isolated-pawn position for Black: blockade d5, trade pieces and the d4-pawn becomes a weakness in the endgame.', es: 'Una posición de peón aislado cómoda para las negras: bloquear d5, cambiar piezas y el peón de d4 se convierte en una debilidad en el final.' },
    },
  },
};
Object.assign(MAIN_LINES, MORE);
