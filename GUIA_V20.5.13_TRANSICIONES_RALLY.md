# Volley Coach V20.5.13 · Transiciones reversibles de rally en TypeScript

## Resultado

Esta es una versión de **arquitectura y pruebas**, no una sustitución del motor de puntos ni una pantalla nueva.

1. Nuevo `src/domain/rally-transition.ts`: contratos y **proyecciones puras** de `award-point` y `undo-last-rally` con puntuación, saque y rotaciones. El comando real sigue ejecutándose exclusivamente en el motor histórico.
2. Si falta un dato, el partido está finalizado o el marcador/snapshot no es consistente, la proyección devuelve `unknown` o `blocked`, no inventa tanteos ni ejecuta acciones.
3. `src/domain/committed-audit.ts` reutiliza `inspectClosedRally` para cotejar el marcador y el saque/rotaciones entre rallies cerrados. Se elimina así la duplicación de lógica de estas comparaciones.
4. La nueva API está exportada desde `src/vc2055-entry.ts` y empaquetada con Vite en `vc2055-domain-core.mjs`.
5. **No se han tocado** `021-core-scouting-v150-monolithic.js`, los scripts nativos `233`/`234`, los adaptadores de vídeo ni ningún escritor de IndexedDB/CAS/Supabase.

## Qué significa «reversible»

`planAwardPoint(match,winner)` calcula cómo quedarían marcador, saque y rotaciones **sin escribir el partido**. `planUndoLastRally(match)` calcula qué valores originales restauraría el último rally cerrado. Las respuestas son inmutables y llevan `readOnly: true` e `includesLineups: false`: **no incluyen alineaciones, cambios, líbero, cámara ni sincronización**.

Se ha probado la equivalencia con **los cuerpos reales de `scoutAwardPoint` y `scoutUndoRally` extraídos del monolito** (funciones ejecutadas con adaptadores aislados) para 24 combinaciones de equipo al saque, ganador y rotación propia P1–P6. No se han hecho 24 anotaciones en el dispositivo del usuario, ni se ha validado todavía un partido real con líbero/vídeo.

## Instalación en GitHub

### ZIP `SOLO_CAMBIOS` (si ya tienes V20.5.12)

1. Descarga `Volley_Coach_V20.5.13_SOLO_CAMBIOS.zip` y descomprímelo.
2. Copia a la raíz de [volley-coach](https://github.com/marcgnunez-collab/volley-coach), respetando las rutas y sobrescribiendo únicamente los archivos del ZIP.
3. **Añade el archivo nuevo** `src/domain/rally-transition.ts` y la prueba `vc20513-rally-transition.test.cjs`.
4. Actualiza `src/domain/committed-audit.ts`, `src/vc2055-entry.ts`, `package.json`, `package-lock.json`, `index.html`, `service-worker.js`, `README.md`, `vc2055-domain-core.mjs` y los archivos de test incluidos.
5. Comprueba que los scripts `233-vc20512-match-state-core.js` y `234-vc20512-match-state-adapters.js` ya están presentes: **siguen formando parte de V20.5.12 y no hay que borrarlos**.
6. Confirma y publica. Espera a que se active el nuevo service worker; si ves aún la versión anterior, cierra las pestañas de la app y vuelve a abrirla.

No sustituyas el proyecto completo por los archivos de `dist/` en un repositorio que mantiene fuentes. Si tu publicación consume exclusivamente el artefacto Vite, usa el ZIP `PUBLICACION_VITE` por separado.

### Otros ZIP

- `COMPLETO`: copia fuente de V20.5.13, sin `node_modules` ni carpetas temporales de compilación.
- `PUBLICACION_VITE`: carpeta `dist/` compilada para publicación estática.

## Verificaciones realizadas

- `npm run test:foundation`: **86 pruebas aprobadas**, incluyendo TypeScript y Vite.
- Cuatro suites históricas de sincronización, durabilidad y compatibilidad: **39 pruebas aprobadas**.
- **125 pruebas en total**.
- Auditoría de arquitectura: **0 recursos referenciados ausentes**, **0 scripts importados dos veces**.
- El tamaño de `index.html` sigue siendo ~1.770 KiB y existen 77 scripts incrustados; esta fase no pretende fingir una reducción del monolito que aún no se ha producido.

## Comprobaciones manuales antes de usar en competición

1. En escritorio, cierra varios puntos con saque propio y rival; comprueba marcador y cambio de saque en P1–P6.
2. Deshaz el último rally y verifica **también** acciones, alineación, líbero, anotaciones de vídeo y marcador.
3. Abre **Gestión → Auditoría de scoutings / Auditoría de acciones confirmadas** y comprueba que sigue detectando discontinuidades reales al solicitar una comprobación.
4. Comprueba un partido finalizado y la protección frente a nuevas acciones.
5. Comprueba que el mismo partido se actualiza correctamente en móvil y ordenador, también tras una desconexión.

Esta entrega no acredita aún una validación manual de hardware, vídeo ni sincronización real entre dos dispositivos.

## Próxima fase

Después de ampliar los tests nativos para **cierre de set, alineaciones, líbero y vídeo**, preparar un adaptador transaccional opt-in con doble comparación y desactivación inmediata. No instalar un segundo escritor en producción hasta demostrar equivalencia completa y estabilidad de la sincronización.
