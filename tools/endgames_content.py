"""Texts of the Endgames section, condensed from "Los 100 finales que hay que saber" /
"100 Endgames You Must Know" by Jesús de la Villa (Esfera Editorial), used with permission.
Writes public/endgames/content.json. Position numbers (p) are the order in the book's PGN
(public/endgames/positions.json).

Run: python tools/endgames_content.py
"""
import json, os

def T(en, es):
    return {'en': en, 'es': es}

def F(n, title, idea, positions):
    # positions: list of PGN numbers, or (number, note) pairs
    pos = [{'p': p} if isinstance(p, int) else {'p': p[0], 'note': p[1]} for p in positions]
    return {'n': n, 'title': title, 'idea': idea, 'positions': pos}

CHAPTERS = []

# ------------------------------------------------------------------------------------------------
CHAPTERS.append({
    'id': 'basic', 'n': 1,
    'title': T('Basic endgames', 'Finales básicos'),
    'summary': T('King and pawn against king, and the first piece-against-piece endings: the rule of the square, opposition, critical squares, the rook pawn, and rook against bishop or knight.',
                 'Rey y peón contra rey, y los primeros finales de pieza contra pieza: la regla del cuadrado, la oposición, las casillas críticas, el peón de torre, y torre contra alfil o caballo.'),
    'intro': T('These are the foundations: almost every endgame ends up here, so they must be known perfectly. The key ideas are geometric (the square, the opposition, the critical squares) and they appear again and again in the rest of the book.',
               'Son los cimientos: casi todos los finales acaban aquí, así que hay que conocerlos a la perfección. Las ideas clave son geométricas (el cuadrado, la oposición, las casillas críticas) y aparecen una y otra vez en el resto del libro.'),
    'finals': [
        F(1, T('The rule of the square', 'El cuadrado del peón'),
          T('Can the king catch a passed pawn on its own? Draw an imaginary square from the pawn to its promotion rank. Rule of the square: if, with its move, the king steps inside the square, it catches the pawn; if not, the pawn queens.\nIf the defending king is inside the square, the pawn can only queen with the help of its own king, usually by getting in the way of the enemy king (shouldering it away).',
            '¿Puede el rey alcanzar solo a un peón pasado? Imagina un cuadrado desde el peón hasta su casilla de coronación. Regla del cuadrado: si con su jugada el rey entra en el cuadrado, alcanza al peón; si no entra, el peón corona.\nSi el rey defensor está dentro del cuadrado, el peón solo puede coronar con la ayuda de su rey, normalmente interponiéndose en el camino del rey rival (apartándolo con el hombro).'),
          [(1, T('Black\'s king is outside the square of the a-pawn: 1.a4 and it cannot be caught.', 'El rey negro está fuera del cuadrado del peón de a: 1.a4 y no hay forma de alcanzarlo.')),
           (2, T('The black king is inside the square, so White\'s king must clear the way first: Kc7 keeps the black king away from the pawn\'s path.', 'El rey negro está dentro del cuadrado, así que el rey blanco debe abrir camino primero: Rc7 mantiene al rey negro lejos del camino del peón.'))]),
        F(2, T('The pawn on the sixth rank. The opposition', 'El peón en sexta. La oposición'),
          T('With the pawn on the sixth rank and the king next to it, the result depends on the opposition: the kings face each other with one square between them, and the side that does NOT have to move "has the opposition".\nWith the pawn on the 6th, the stronger side wins if its king can reach the 7th rank next to the pawn, or if it can push the pawn to the 7th with check. Watch out for stalemate traps near the edge, and remember that the knight pawn (b/g) has extra stalemate resources for the defender.',
            'Con el peón en sexta y el rey al lado, el resultado depende de la oposición: los reyes se enfrentan con una casilla entre ellos, y el bando al que NO le toca mover "tiene la oposición".\nCon el peón en sexta, el bando fuerte gana si su rey alcanza la séptima junto al peón, o si puede llevar el peón a séptima con jaque. Cuidado con las trampas de ahogado cerca de la banda, y recuerda que con el peón de caballo (b/g) el defensor tiene recursos de ahogado adicionales.'),
          [(3, T('White to move: f7 and Kg7 escort the pawn home.', 'Juegan blancas: f7 y Rg7 acompañan al peón hasta coronar.')),
           (4, T('Black to move holds the draw by taking the opposition at the right moment: only Kg8! works.', 'Si juegan negras, hacen tablas tomando la oposición en el momento justo: solo sirve Rg8!.')),
           (5, T('White takes the opposition with Ka6! (not Kb6?? Kb8) and the pawn queens.', 'Las blancas toman la oposición con Ra6! (no Rb6?? Rb8) y el peón corona.')),
           (6, T('Even from further away, the opposition guides the king manoeuvres.', 'Incluso desde más lejos, la oposición guía las maniobras de los reyes.')),
           (7, T('With the knight pawn, the edge gives the defender stalemate tricks: hold the draw.', 'Con el peón de caballo, la banda da al defensor trucos de ahogado: mantén las tablas.'))]),
        F(3, T('The critical squares', 'Las casillas críticas'),
          T('Every pawn has critical squares: if the stronger king reaches one of them, the pawn queens no matter who is to move. For a pawn up to the 4th rank they are the three squares two ranks in front of it; for a pawn on the 5th or 6th, also the squares one rank in front.\nThe defender fights with the opposition (direct or distant) to keep the king away from them; the attacker can use pawn moves as "reserve tempi" to win the opposition back.',
            'Cada peón tiene casillas críticas: si el rey fuerte llega a una de ellas, el peón corona juegue quien juegue. Para un peón hasta la cuarta fila son las tres casillas dos filas por delante; para un peón en quinta o sexta, también las de una fila por delante.\nEl defensor lucha con la oposición (directa o distante) para alejar al rey de ellas; el atacante puede usar los movimientos del peón como "tiempos de reserva" para recuperar la oposición.'),
          [8, 9, 10, 11,
           (12, T('With the knight pawn, beware of stalemate in the corner: Kg6! and the pawn goes through.', 'Con el peón de caballo, cuidado con el ahogado en el rincón: Rg6! y el peón pasa.')),
           (13, T('The pawn on the 4th: the king must reach the critical squares on the 6th rank (c6, d6, e6).', 'El peón en cuarta: el rey debe llegar a las casillas críticas de la sexta fila (c6, d6, e6).')),
           (14, T('Black to move takes the opposition and keeps the white king out: draw.', 'Si juegan negras, toman la oposición y mantienen fuera al rey blanco: tablas.')),
           (15, T('The reserve tempo: g4! hands the move to Black and the king reaches the new critical squares.', 'El tiempo de reserva: ¡g4! cede el turno a las negras y el rey alcanza las nuevas casillas críticas.'))]),
        F(4, T('The rook pawn. The defending king in front', 'El peón de torre. El rey defensor delante'),
          T('Everything said so far is valid for all pawns except the rook pawn. If the defending king gets in front of a rook pawn, it is a draw: the stronger king is shut in at the edge and stalemate appears. Not even several rook pawns help.',
            'Todo lo dicho hasta ahora vale para todos los peones menos el de torre. Si el rey defensor se coloca delante de un peón de torre, es tablas: el rey fuerte queda encerrado en la banda y aparece el ahogado. Ni siquiera varios peones de torre sirven.'),
          [(16, T('Black just keeps the king in the corner: draw.', 'Las negras simplemente mantienen el rey en el rincón: tablas.'))]),
        F(5, T('Shutting in the stronger king', 'El encierro del rey fuerte'),
          T('Against the rook pawn there is a second way to draw: shut the stronger king in. If the defending king controls the bishop-file squares next to the corner (c1/c2 for an a-pawn, f8/f7 for an h-pawn), the attacking king cannot get out and the pawn cannot promote on its own.',
            'Contra el peón de torre hay una segunda forma de hacer tablas: encerrar al rey fuerte. Si el rey defensor controla las casillas de la columna de alfil junto al rincón (c1/c2 para un peón de a, f8/f7 para uno de h), el rey atacante no puede salir y el peón no corona solo.'),
          [(17, T('Black shuttles between f8 and f7, keeping the white king locked on the h-file.', 'Las negras van y vienen entre f8 y f7, manteniendo al rey blanco encerrado en la columna h.'))]),
        F(6, T('Rook against bishop. The bad corner', 'Torre contra alfil. El rincón malo'),
          T('Rook against bishop is usually a draw, but the defending king must not get trapped in the "bad corner": the corner of the same colour as the bishop. There the bishop cannot block the checks on the back rank and the stronger side wins with a combination of checks and the threat of mate.',
            'Torre contra alfil suele ser tablas, pero el rey defensor no debe quedar atrapado en el "rincón malo": el del mismo color que el alfil. Allí el alfil no puede tapar los jaques en la última fila y el bando fuerte gana combinando jaques y amenazas de mate.'),
          [(19, T('The black king is in the corner of the bishop\'s colour: White wins.', 'El rey negro está en el rincón del color del alfil: ganan las blancas.'))]),
        F(7, T('Rook against bishop. The good corner', 'Torre contra alfil. El rincón bueno'),
          T('In the opposite corner (of the other colour from the bishop) the defence is easy: the bishop can always block the check on the back rank, and the king can step into the corner because stalemate tricks save it.',
            'En el rincón contrario (del color distinto al del alfil) la defensa es fácil: el alfil siempre puede tapar el jaque en la última fila, y el rey puede meterse en el rincón porque los recursos de ahogado lo salvan.'),
          [(18, T('Hold the draw with the bishop in the good corner.', 'Mantén las tablas con el alfil en el rincón bueno.'))]),
        F(8, T('Rook against knight. King and knight on the edge', 'Torre contra caballo. Rey y caballo en la banda'),
          T('Rook against knight is a draw if the knight stays next to its king. The danger is having the king on the edge with the knight cut off: then the knight can be trapped or lost. Keep the knight close and use checks to gain time.',
            'Torre contra caballo es tablas si el caballo se mantiene junto a su rey. El peligro es tener el rey en la banda con el caballo separado: entonces el caballo puede quedar atrapado o perderse. Mantén el caballo cerca y usa los jaques para ganar tiempo.'),
          [(20, T('Hold the draw: the knight dances around its king with checks.', 'Mantén las tablas: el caballo baila alrededor de su rey dando jaques.'))]),
        F(9, T('King and knight in the corner', 'Rey y caballo en el rincón'),
          T('With king and knight in the corner, the defence can collapse: the knight has very few squares, the king is stuck, and the stronger side wins with mating threats or by winning the knight. Avoid the corner if you defend with a knight.',
            'Con rey y caballo en el rincón, la defensa puede derrumbarse: el caballo tiene muy pocas casillas, el rey está atascado, y el bando fuerte gana con amenazas de mate o ganando el caballo. Evita el rincón si defiendes con caballo.'),
          [(21, T('Whoever moves, the knight in the corner is in trouble: Black wins.', 'Juegue quien juegue, el caballo en el rincón está en apuros: ganan las negras.')),
           (22, T('Black to move wins the knight.', 'Juegan negras y ganan el caballo.'))]),
    ],
})


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, '..', 'public', 'endgames', 'content.json')
    json.dump({'chapters': CHAPTERS}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    n = sum(len(c['finals']) for c in CHAPTERS)
    p = sum(len(f['positions']) for c in CHAPTERS for f in c['finals'])
    print(f'{len(CHAPTERS)} chapters, {n} finals, {p} positions')


if __name__ == '__main__':
    main()
