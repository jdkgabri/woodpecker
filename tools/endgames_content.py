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

# ------------------------------------------------------------------------------------------------
CHAPTERS.append({
    'id': 'knight-pawn', 'n': 2,
    'title': T('Knight against a pawn', 'Caballo contra un peón'),
    'summary': T('How a lone knight stops a passed pawn, and the exceptions of the knight and rook pawns.',
                 'Cómo un caballo solo detiene a un peón pasado, y las excepciones de los peones de caballo y de torre.'),
    'intro': T('A knight can usually stop a pawn on its own if it reaches a square in front of it or controls the promotion square. The edge of the board is the knight\'s enemy: against knight and rook pawns it has far fewer squares.',
               'Un caballo normalmente puede detener solo a un peón si llega a una casilla delante de él o controla la casilla de coronación. La banda es la enemiga del caballo: contra los peones de caballo y de torre tiene muchas menos casillas.'),
    'finals': [
        F(10, T('Knight against a pawn on the seventh', 'Caballo contra peón en séptima'),
          T('Against a central or bishop pawn on the 7th, the knight draws if it can get in front of the pawn or keep the promotion square under control, using checks to gain time and controlling from the side if necessary. Once in front, it can manoeuvre on both sides of the pawn and the defence is easy.',
            'Contra un peón central o de alfil en séptima, el caballo hace tablas si puede ponerse delante del peón o mantener controlada la casilla de coronación, usando jaques para ganar tiempo y controlando de lado si hace falta. Una vez delante, puede maniobrar a ambos lados del peón y la defensa es fácil.'),
          [(23, T('Nd1! gets in front of the pawn: from there the knight can always return.', '¡Cd1! se pone delante del peón: desde allí el caballo siempre puede volver.')),
           (24, T('Controlling from the side with checks until the knight reaches the right square.', 'Controlando de lado con jaques hasta que el caballo llega a la casilla buena.'))]),
        F(11, T('The knight pawn', 'El peón de caballo'),
          T('With the knight pawn on the 7th, the corner limits the knight: if it does not manage to get in front of the pawn, it cannot stop it.',
            'Con el peón de caballo en séptima, el rincón limita al caballo: si no logra ponerse delante del peón, no puede pararlo.'),
          [(25, T('...b2! and the knight is too late.', '...¡b2! y el caballo llega tarde.'))]),
        F(12, T('The rook pawn on the sixth', 'El peón de torre en sexta'),
          T('Against a rook pawn on the 6th the knight usually draws by getting in front of the pawn with checks, but it must use the right route.',
            'Contra un peón de torre en sexta el caballo suele hacer tablas poniéndose delante del peón con jaques, pero debe usar la ruta correcta.'),
          [26]),
        F(13, T('The rook pawn on the seventh', 'El peón de torre en séptima'),
          T('With the rook pawn on the 7th the knight can still save itself, either by reaching the promotion square in time or by building a barrier that keeps the enemy king away while the knight shuttles around it.',
            'Con el peón de torre en séptima el caballo aún puede salvarse, llegando a tiempo a la casilla de coronación o creando una barrera que mantenga alejado al rey rival mientras el caballo va y viene.'),
          [27, 28]),
        F(14, T('King and knight give mate', 'El rey y el caballo dan mate'),
          T('An important exception: with the defending king in the corner in front of its own rook pawn, king and knight can deliver mate.',
            'Una excepción importante: con el rey defensor en el rincón delante de su propio peón de torre, rey y caballo pueden dar mate.'),
          [(29, T('Nc1 and Nb3#: the pawn blocks its own king.', 'Cc1 y Cb3#: el peón tapona a su propio rey.'))]),
        F(15, T('The knight\'s silly square', 'La casilla tonta del caballo'),
          T('The second square of the long diagonal (b2, g2, b7, g7) is a poor square for a knight: from there it can hardly stop a rook pawn.',
            'La segunda casilla de la gran diagonal (b2, g2, b7, g7) es mala para un caballo: desde allí apenas puede detener a un peón de torre.'),
          [(30, T('From g2 the knight cannot stop the h-pawn.', 'Desde g2 el caballo no puede parar el peón de h.'))]),
    ],
})

# ------------------------------------------------------------------------------------------------
CHAPTERS.append({
    'id': 'queen-pawn', 'n': 3,
    'title': T('Queen against a pawn', 'Dama contra peón'),
    'summary': T('The queen wins against a pawn on the 7th with the standard method, except for rook and bishop pawns, where stalemate saves the defender unless the king is close.',
                 'La dama gana contra un peón en séptima con el método estándar, excepto con peones de torre y de alfil, donde el ahogado salva al defensor salvo que el rey esté cerca.'),
    'intro': T('The winning method: approach with checks and pins, force the enemy king in front of its pawn, and use each of those tempi to bring your own king closer. Rook and bishop pawns are exceptions because of stalemate.',
               'El método ganador: acercarse con jaques y clavadas, obligar al rey rival a ponerse delante de su peón, y aprovechar cada uno de esos tiempos para acercar el propio rey. Los peones de torre y de alfil son excepciones por el ahogado.'),
    'finals': [
        F(16, T('Queen against a pawn on the seventh', 'Dama contra peón en séptima'),
          T('Against a knight or central pawn on the 7th, the queen wins: with checks and pins it forces the king onto the promotion square, and in that moment its own king takes a step closer. Repeat until the king arrives. Beware of your own king blocking the queen.',
            'Contra un peón de caballo o central en séptima, la dama gana: con jaques y clavadas obliga al rey a meterse en la casilla de coronación, y en ese momento su propio rey da un paso. Se repite hasta que el rey llega. Cuidado con que el propio rey estorbe a la dama.'),
          [31, (32, T('Here the king is in the way and the pawn queens: draw.', 'Aquí el rey estorba y el peón corona: tablas.'))]),
        F(17, T('Queen against a rook pawn on the seventh', 'Dama contra peón de torre en séptima'),
          T('Against a rook pawn the method fails: when the king goes into the corner it is stalemate. The queen only wins if its king is already close enough to create mating threats.',
            'Contra el peón de torre el método falla: cuando el rey se mete en el rincón, es ahogado. La dama solo gana si su rey ya está lo bastante cerca para crear amenazas de mate.'),
          [33, 34]),
        F(18, T('Queen against a bishop pawn on the seventh', 'Dama contra peón de alfil en séptima'),
          T('Against a bishop pawn, the defender can take the pawn and is stalemated in the corner. The result depends on which side of the pawn the defending king is ("good side" towards the corner, "bad side" towards the centre) and on how close the stronger king is to the critical squares where it can help deliver mate.',
            'Contra un peón de alfil, el defensor puede dejar que le tomen el peón y quedar ahogado en el rincón. El resultado depende del lado del peón en el que esté el rey defensor ("lado bueno", hacia el rincón; "lado malo", hacia el centro) y de lo cerca que esté el rey fuerte de las casillas críticas donde puede ayudar a dar mate.'),
          [35, 36, 37, (38, T('The mate on d7: the king is within reach, so precise checks win.', 'El mate en d7: el rey está a tiempo, así que los jaques precisos ganan.'))]),
        F(19, T('A trick that happens too often', 'Un truco demasiado frecuente'),
          T('When the defending king hides in the corner with a queen just promoted, the stronger side must watch out for stalemate and perpetual-check tricks before grabbing material.',
            'Cuando el rey defensor se refugia en el rincón con una dama recién coronada, el bando fuerte debe vigilar los trucos de ahogado y jaque perpetuo antes de capturar material.'),
          []),
        F(20, T('Queen against queen', 'Dama contra dama'),
          T('After a pawn race both sides may have a queen. It is not always a draw: a queen on the edge or in the corner can be lost to a skewer or caught in a mating net.',
            'Tras una carrera de peones ambos bandos pueden tener dama. No siempre es tablas: una dama en la banda o en el rincón puede perderse por un ataque en rayos X o quedar en una red de mate.'),
          [39]),
    ],
})

# ------------------------------------------------------------------------------------------------
CHAPTERS.append({
    'id': 'rook-pawn', 'n': 4,
    'title': T('Rook against a pawn', 'Torre contra peón'),
    'summary': T('Counting tempi, the horizontal cut, the knight underpromotion, the "rodeo", shouldering, and the rook pawn: one of the most practical chapters.',
                 'Contar tiempos, el corte horizontal, la coronación de caballo, el rodeo, el empuje con el hombro y el peón de torre: uno de los capítulos más prácticos.'),
    'intro': T('Many rook endings turn into rook against pawn. The first approach is counting: how many moves the rook side needs to control the queening square and the pawn side to push. Then the kings interfere, and the special resources appear.',
               'Muchos finales de torres acaban en torre contra peón. La primera aproximación es contar: cuántas jugadas necesita el bando de la torre para controlar la casilla de coronación y el del peón para avanzar. Después los reyes se estorban y aparecen los recursos especiales.'),
    'finals': [
        F(21, T('When the kings do not interfere', 'Los reyes no se molestan'),
          T('When each king is on a different side of the pawn, simply count tempi: the rook side needs its king to reach the pawn in time; the pawn side needs to promote or tie the rook down first. Small changes in the order of moves can change everything.',
            'Cuando cada rey está a un lado distinto del peón, basta contar tiempos: el bando de la torre necesita que su rey llegue a tiempo al peón; el del peón, coronar o atar a la torre antes. Pequeños cambios en el orden de jugadas pueden cambiarlo todo.'),
          [40, 41, (42, T('Euwe\'s study: whether it is a win depends on exactly where the king starts.', 'El estudio de Euwe: que sea ganada depende exactamente de dónde empieza el rey.'))]),
        F(22, T('Defending king on the third rank. The horizontal cut', 'Rey defensor en tercera. El corte horizontal'),
          T('If the defending king and its pawn are still far back, cutting the king off horizontally (the rook on the rank in front of the king) is very effective. It wins outright when the pawn is a rook pawn or when king and pawn have separated.',
            'Si el rey defensor y su peón están todavía atrás, cortar al rey horizontalmente (la torre en la fila delante del rey) es muy eficaz. Gana directamente cuando el peón es de torre o cuando rey y peón se han separado.'),
          [(43, T('The horizontal cut: the king cannot cross and the pawn falls.', 'El corte horizontal: el rey no puede cruzar y el peón cae.'))]),
        F(23, T('The stronger king behind the pawn', 'El rey fuerte detrás del peón'),
          T('With the stronger king behind the pawn, the defender\'s main resource is promoting to a knight, which escapes the mating threats. The attacker answers with the "rodeo": the king goes around to the other side of the pawn instead of pushing from behind.',
            'Con el rey fuerte detrás del peón, el principal recurso del defensor es coronar caballo, que escapa de las amenazas de mate. El atacante responde con el "rodeo": el rey da la vuelta para aparecer al otro lado del peón en lugar de empujar desde atrás.'),
          [(44, T('Hold the draw: when it is time, promote to a knight.', 'Mantén las tablas: cuando llegue el momento, corona caballo.')), 45, 46]),
        F(24, T('The stronger king on the side', 'El rey fuerte en una zona lateral'),
          T('When the stronger king comes from the side, the key is to "shoulder" the enemy king: take the opposition so that a rook check pushes it one file or rank further away. A well-timed rook check can also gain the tempo you need.',
            'Cuando el rey fuerte viene de lado, la clave es "empujar con el hombro" al rey rival: tomar la oposición para que un jaque de torre lo aleje una columna o fila más. Un jaque de torre oportuno también puede ganar el tiempo que falta.'),
          [47, 48, 49]),
        F(25, T('The rook in front of the pawn', 'La torre delante del peón'),
          T('With the rook controlling the pawn from the front, zugzwang becomes important: the kings in opposition, and whoever has to move may have to give way. Réti\'s famous study shows it.',
            'Con la torre controlando el peón por delante, el zugzwang se vuelve importante: los reyes en oposición, y quien tiene que mover puede verse obligado a ceder el paso. El famoso estudio de Réti lo muestra.'),
          [(50, T('Réti\'s study: the right waiting move puts the defender in zugzwang.', 'El estudio de Réti: la espera correcta pone al defensor en zugzwang.'))]),
        F(26, T('Special themes of the knight pawn', 'Temas especiales del peón de caballo'),
          T('The knight pawn has its own quirks: stalemate ideas help the defender, but if the defending king is forced in front of its pawn, its chances drop sharply.',
            'El peón de caballo tiene sus particularidades: las ideas de ahogado ayudan al defensor, pero si el rey defensor es obligado a ponerse delante de su peón, sus opciones caen drásticamente.'),
          [(51, T('Kopaev\'s study: checks to gain time and keep the king on the wrong side.', 'El estudio de Kopaev: jaques para ganar tiempo y mantener al rey en el lado malo.'))]),
        F(27, T('Rook pawn. Pushing from behind', 'Peón de torre. El empuje desde atrás'),
          T('Against the rook pawn, pushing with the king from behind (with rook checks) works, unlike with other pawns: a knight promoted in the corner is lost.',
            'Contra el peón de torre, empujar con el rey desde atrás (con jaques de torre) sí funciona, al contrario que con los demás peones: el caballo coronado en el rincón se pierde.'),
          [52]),
        F(28, T('Rook pawn. Pushing from the side', 'Peón de torre. El empuje lateral'),
          T('Pushing from the side is less effective against a rook pawn because the defending king can hide in the corner with stalemate ideas. There is a limit position worth memorising: with one side to move it is a draw, with the other it wins.',
            'El empuje lateral es menos eficaz contra el peón de torre porque el rey defensor puede refugiarse en el rincón con ideas de ahogado. Hay una posición límite que conviene memorizar: con un bando al turno es tablas, con el otro gana.'),
          [53, 54, 55]),
        F(29, T('The pawn beats the rook', 'El peón gana a la torre'),
          T('Sometimes the rook cannot stop the pawn and even loses: the Saavedra/Barbier ideas with stalemate and underpromotion, and practical cases where the king escapes the checks by hiding near the pawn.',
            'A veces la torre no puede parar al peón e incluso pierde: las ideas de Barbier y Saavedra con ahogado y subpromoción, y casos prácticos en los que el rey escapa de los jaques escondiéndose cerca del peón.'),
          [(56, T('The king walks towards the pawn and finds shelter from the checks.', 'El rey camina hacia el peón y encuentra refugio contra los jaques.'))]),
    ],
})

# ------------------------------------------------------------------------------------------------
CHAPTERS.append({
    'id': 'rook-two-pawns', 'n': 5,
    'title': T('Rook against two pawns', 'Torre contra dos peones'),
    'summary': T('Two connected pawns on the sixth beat a rook; who wins depends on the kings.', 'Dos peones ligados en sexta ganan a la torre; quién gana depende de los reyes.'),
    'intro': T('The basic rule: two connected passed pawns on the 6th rank beat a rook if the kings are far away. When the kings take part, the rook side often wins by attacking the pawns from behind or with its king in front.',
               'La regla básica: dos peones pasados ligados en sexta ganan a la torre si los reyes están lejos. Cuando los reyes participan, el bando de la torre suele ganar atacando los peones por detrás o con su rey delante.'),
    'finals': [
        F(30, T('The kings do not take part', 'Los reyes no participan'),
          T('Without the kings, two connected pawns on the 6th rank promote: whatever the rook does, one of them gets through. Further back, the rook can stop them, attacking from behind.',
            'Sin los reyes, dos peones ligados en sexta coronan: haga lo que haga la torre, uno de ellos pasa. Más atrás, la torre puede detenerlos atacándolos por detrás.'),
          [57, 58, 59, 60]),
        F(31, T('Both kings take part', 'Los dos reyes participan'),
          T('With the stronger king in front of the pawns, the rook usually wins them; with the king on the side, there are stalemate defences. Know the series of rook-against-pawns positions on the 7th.',
            'Con el rey fuerte frente a los peones, la torre suele ganarlos; con el rey de lado, hay defensas de ahogado. Conviene conocer la serie de posiciones de torre contra peones en séptima.'),
          [61, 62, 63, 64, 65]),
        F(32, T('Only the pawns\' king takes part', 'Sólo el rey de los peones participa'),
          T('When only the pawns\' king helps, the rook\'s resources are checks from a distance and contacting the backward pawn ("hooking the tail"). Count carefully: sometimes the pawns win, sometimes the rook holds.',
            'Cuando solo ayuda el rey de los peones, los recursos de la torre son los jaques de lejos y contactar con el peón retrasado ("gancho de cola"). Hay que contar bien: a veces ganan los peones y otras aguanta la torre.'),
          [66, 67]),
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
