# Volley Coach V20.5.22 · Estado de scouting y consultas unificadas

## Qué mejora

Continúa la migración por etapas iniciada en V20.5.21. Las dos vistas ya existentes en Scouting:

- **DIRECTO → Estadísticas LIVE:** Side-Out, Break Point, recepción y eficiencia de ataque.
- **ANALIZAR → Boxscore profesional:** jugadores, equipo, set/partido y rotaciones P1–P6.

utilizan ahora un servicio compartido, escrito en TypeScript: `src/state/scouting-projections.ts`.

El servicio se conecta **una sola vez** al hub `VC_STATE_2059`, ya existente. Mantiene los informes derivados en memoria para evitar repetir escaneos de rallies si una vista solicita los mismos datos varias veces. Se admiten como máximo **ocho combinaciones filtradas** de informes de jugadores, además de un informe LIVE. No guarda ningún duplicado del objeto partido.

Al recibir una edición, un rally confirmado, una corrección histórica o un deshacer, el aviso del estado canónico invalida ambas cachés, incluso si los números del marcador no han cambiado. Los cambios de filtro también consultan el servicio compartido. La API pública de cada panel y sus elementos visuales siguen intactos.

## Límites deliberados

- **No** reescribe el motor de scouting ni cambia cómo se registran los puntos.
- **No** escribe en IndexedDB, `localStorage`, Supabase o el diario CAS.
- **No** añade un segundo observador de `MatchState`: depende del único hub preexistente.
- **No** convierte todavía el resto de las más de cien capas antiguas en módulos ES6.
- No promete latencia en milisegundos sin medir rendimiento en partidos reales ni sustituye la prueba PC/móvil.

Si por compatibilidad no está disponible el nuevo gateway, las dos vistas mantienen la lectura anterior, también de solo lectura.

## Instalación en GitHub

La **base necesaria es V20.5.21**. Descarga `Volley_Coach_V20.5.22_SOLO_CAMBIOS.zip`, descomprímelo y sube **todos los archivos y subcarpetas** a la raíz del [repositorio Volley Coach](https://github.com/marcgnunez-collab/volley-coach), sustituyendo los archivos homónimos. Confirma los cambios y espera a que termine la ejecución de GitHub Actions.

No elimines los archivos antiguos, especialmente `211-vc2012-multi-device-validation.js`, `233-vc20512-match-state-core.js` ni `234-vc20512-match-state-adapters.js`. El ZIP COMPLETO sirve para una copia nueva de todo el proyecto. `PUBLICACION_VITE` contiene solo la salida compilada y no sustituye el código fuente para GitHub.

Comprueba el despliegue haciendo una actualización sin caché (Ctrl+F5). En Scouting → DIRECTO verifica los porcentajes y en Scouting → ANALIZAR cambia de jugador/equipo, set y P1–P6. Corrige un rally de prueba y usa Deshacer: ambos informes deben reflejar el dato confirmado sin duplicar acciones. En dos dispositivos comprueba que el cambio realmente se recibe y se aplica; el indicador «conectado» por sí solo no lo garantiza.

## Verificación automatizada

`npm ci` y luego `npm run test:foundation`. El test `vc20522-scouting-projections.test.cjs` verifica reutilización de informes, invalidación ante correcciones/undo, máximo de entradas cacheadas, única suscripción nativa, integración con las dos interfaces y preservación del código escritor V13.

## Siguiente etapa

Llevar al gateway otras vistas de Análisis/Scouting por separado, medir la duración de consultas sobre temporadas grandes, y reducir gradualmente scripts clásicos. El cambio de motor de puntos se reservará para una fase posterior con pruebas reales de rollback y multi-dispositivo.
