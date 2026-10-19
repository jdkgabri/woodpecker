# Woodpecker trainer

PWA para entrenar táctica con el método Woodpecker (ciclos repetidos del mismo set).

- Los 1128 ejercicios de *The Woodpecker Method*, con selección de rango o nivel
  (1–222 fáciles, 223–984 intermedios, 985–1128 avanzados).
- Sets opcionales de puzles de Lichess por tema y dificultad.
- Cronómetro del ciclo con pausa (botón, tecla `espacio`/`p`, o pausa automática al salir de la app).
- Sin cuentas: el progreso se queda en el dispositivo; copia de seguridad con exportar/importar.

## Desarrollo

```sh
npm install
npm run dev       # servidor local
npm run build     # genera dist/ (sitio estático listo para publicar)
```

## Soluciones

`public/woodpecker.json` se genera con `tools/solve.py` (Stockfish 17.1)
a partir del PGN del libro, que solo trae las posiciones. Formato por ejercicio:
`{ n, fen, t }`, con `t = [[jugadaUci, respuestaUci|null, subárbol|null], ...]`;
la primera entrada es la línea principal y el resto alternativas aceptadas.
Cualquier jugada que dé mate se acepta siempre.

## Análisis

La pantalla de análisis usa Stockfish 17.1 compilado a WebAssembly
([stockfish.js](https://github.com/nmrugg/stockfish.js), versión *lite single-thread*),
en `public/stockfish/`. Stockfish es software libre bajo licencia GPLv3 (`public/stockfish/COPYING.txt`).
