# Volley Coach V20.5.14 · Límites de set y recuperación de rallies

## Resumen de la fase

Esta versión **extiende la arquitectura TypeScript y sus pruebas de equivalencia**. No cambia ninguna pantalla ni reemplaza los escritores reales.

### Nuevo módulo

`src/domain/rally-boundaries.ts` aporta dos comprobaciones puras, pequeñas y sin acceso a datos externos:

- `projectSetBoundary(match,score)`: calcula de forma hipotética si el tanteo cierra el set (25 puntos en sets 1–4, 15 en el quinto; diferencia mínima de dos), quién lo gana y si sería el tercer set ganado. Cuando faltan datos devuelve `unknown`.
- `inspectRallyRestoration(rally)`: informa **solo de la cobertura** de las instantáneas necesarias para deshacer (alineación, base, líbero, roles, acciones y marcadores del vídeo). No devuelve jugadores, identificadores de vídeo ni sus datos.

`src/domain/rally-transition.ts` añade estas dos proyecciones al plan de punto/deshacer creado en V20.5.13. `src/vc2055-entry.ts` las expone mediante el módulo ES6 compilado con Vite.

`readOnly: true` sigue siendo una garantía del **nuevo código TypeScript**, no de las funciones nativas que se ejecutan deliberadamente en los tests. No se ha añadido ningún segundo escritor para puntos, sets, alineaciones, vídeos o nube.

### Pruebas concretas

- Cierre y no cierre con puntuaciones normales, quinto set y varios desempates a diferencia de dos.
- Cierre de partido por el tercer set ganado y respeto a los sets anteriores.
- Recuperación de alineación, alineación base, líbero manual, líbero automático, roles y acciones usando los **cuerpos reales** de `scoutAwardPoint` y `scoutUndoRally` en un entorno simulado.
- Ejecución del código real de los wrappers V7.4 de vídeo: el marcador de inicio, fin, sesión y fecha del clip vuelve al rally activo después del deshacer.
- Registros incompletos: se declaran rutas de recuperación antiguas (`native-fallback`) y enlaces parciales en vez de afirmar que están completos.
- Continúan las 24 combinaciones de P1–P6 de V20.5.13 y las pruebas históricas de CAS/sincronización.

**Límites:** la simulación controla servicios externos (guardado, reloj, cámaras y competición), y solo prueba combinaciones representativas de líbero. No es una certificación de todas las reglas oficiales ni una prueba con dos dispositivos reales.

## Resultado automatizado

- `npm run test:foundation`: **93 pruebas aprobadas**, incluida compilación TypeScript y Vite.
- Cuatro suites históricas de sincronización, recuperación y compatibilidad: **39 pruebas aprobadas**.
- Total: **132 pruebas aprobadas**.
- Inventario estructural: 0 referencias a recursos ausentes y 0 scripts duplicados. No se ha reducido aún el gran monolito de `021-core-scouting-v150-monolithic.js`.

## Subir a GitHub

### Opción A: SOLO CAMBIOS (recomendada)

Se requiere haber instalado primero **V20.5.13**.

1. Descargar `Volley_Coach_V20.5.14_SOLO_CAMBIOS.zip` y descomprimirlo.
2. En [volley-coach](https://github.com/marcgnunez-collab/volley-coach), copiar sus archivos a la raíz preservando rutas y sobrescribiendo solo los nombres incluidos.
3. **Añadir** `src/domain/rally-boundaries.ts`, `vc20514-rally-boundaries.test.cjs` y esta guía.
4. **Actualizar** `src/domain/rally-transition.ts`, `src/vc2055-entry.ts`, `package.json`, `package-lock.json`, `index.html`, `service-worker.js`, `README.md`, `vc2055-domain-core.mjs` y los tests históricos incluidos.
5. Publicar y recargar la web cuando esté activo el nuevo service worker.

No borrar los scripts históricos, especialmente `021-core-scouting-v150-monolithic.js`, `233-vc20512-match-state-core.js` y `234-vc20512-match-state-adapters.js`. **No convertirlos a `type="module"` ni cambiar su orden de ejecución.**

### Opción B: COMPLETO

El ZIP completo conserva los archivos fuente y scripts históricos; excluye `node_modules` y carpetas de compilación temporales.

### Opción C: PUBLICACION_VITE

La distribución compilada de Vite está preparada para publicación estática. No mezclarla indiscriminadamente con un repositorio que conserva sus archivos fuente.

## Prueba manual mínima antes de competición

1. Probar puntos al final de un set normal y del quinto set, incluidos 24–24 y 14–14.
2. Comprobar un partido con dos sets ganados y que el tercero lo finaliza correctamente.
3. Deshacer un rally, revisar marcador, saque, alineación base, líbero y acciones recuperadas.
4. Grabar un fragmento, cerrar un rally con vídeo y deshacer: los enlaces del clip deben seguir presentes.
5. Verificar el resultado entre portátil y móvil, incluido un corte y recuperación de la conexión.

Hasta superar esas pruebas, la validación automatizada **no** equivale a una puesta en producción totalmente certificada.

## Siguiente bloque de estructura

Preparar un **comparador en sombra del ciclo de vida completo del rally**, sin escritores, que pueda registrar diferencias entre las proyecciones TypeScript y los resultados ya confirmados por el motor nativo. Solo con resultados estables tendrá sentido estudiar un adaptador de comandos reversible y activable de forma controlada.
