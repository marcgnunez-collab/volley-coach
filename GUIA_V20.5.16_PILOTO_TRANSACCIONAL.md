# Volley Coach V20.5.16 · Piloto transaccional de comandos

## Qué se ha construido

Esta es una **fase de arquitectura**, no una sustitución del registro real de puntos.

Nuevo `src/domain/rally-transaction-pilot.ts`: un coordinador independiente, TypeScript y ES6 que permite, **si un test o un consumidor futuro le proporciona explícitamente el motor nativo**, recorrer el ciclo completo de un comando:

1. Leer el partido canónico y proyectar el punto o deshacer con los módulos de V20.5.13–V20.5.14.
2. Encolar comandos en orden de llegada para evitar que dos operaciones simultáneas se solapen.
3. Invocar **una sola vez** el comando original recibido. El piloto no implementa otro guardado ni una segunda puntuación.
4. Tras la respuesta, cotejar el resultado real con la proyección y registrar una categoría anónima: coincidencia, diferencia o sin verificar.
5. Si el comando nativo rechaza la operación, devolver el **mismo error** sin reintentar, compensar, reescribir o marcar como confirmado un cambio incierto.

El estado queda limitado a contadores y hasta 40 incidencias anónimas, sin jugadores, dorsales, códigos, identificadores ni enlaces de vídeo. `disable()` impide **nuevas llamadas al piloto**, pero no cancela ni revierte operaciones nativas ya iniciadas.

## ¿Está activado en Scouting?

**NO.** `createRallyTransactionPilot` está exportado en el paquete TypeScript para pruebas aisladas y una futura integración controlada. **No está montado** en los botones, ni reemplaza `v121AwardPoint`, `v121UndoRally`, `MatchState.commands`, la cadena de vídeo, el diario IndexedDB o CAS/Supabase.

Esto es importante: los controles de partido, el código rápido y el deshacer siguen funcionando por la ruta histórica exactamente como en V20.5.15. El nuevo coordinador no se ejecuta durante los puntos reales.

## Pruebas añadidas

- El delegado nativo se invoca una sola vez en punto y deshacer, conservando su valor de retorno.
- Dos puntos enviados seguidos se ejecutan **en orden**, sin fusionar ni perder ninguno.
- Un conflicto CAS simulado entre dos clientes provoca un único intento fallido; no hay reintento automático ni falsa confirmación.
- Si faltan datos para proyectar, el comando original sigue siendo la autoridad.
- Los partidos finalizados siguen dependiendo del bloqueo del motor nativo.
- Desactivar el piloto no cancela una escritura ya iniciada.
- El informe retiene un máximo de 40 incidencias y no divulga datos privados.

Resultado de la versión: **110 pruebas actuales** con TypeScript/Vite + **39 pruebas históricas** de sincronización, CAS, recuperación y compatibilidad = **149 pruebas automatizadas**. Auditoría estructural: 0 recursos ausentes y 0 scripts duplicados.

Las pruebas CAS de esta fase son **simuladas**; no acreditan una transacción real contra Supabase ni un partido disputado con dos dispositivos.

## Instalación en GitHub

### ZIP `SOLO_CAMBIOS` (si ya tienes V20.5.15)

1. Descarga `Volley_Coach_V20.5.16_SOLO_CAMBIOS.zip` y descomprímelo.
2. Copia su contenido a la raíz de [volley-coach](https://github.com/marcgnunez-collab/volley-coach), preservando carpetas como `src/domain/`.
3. **Añade** `src/domain/rally-transaction-pilot.ts`, `vc20516-rally-transaction-pilot.test.cjs` y esta guía.
4. **Actualiza** `src/vc2055-entry.ts`, `vc2055-domain-core.mjs`, `index.html`, `service-worker.js`, `package.json`, `package-lock.json`, `README.md` y los archivos de pruebas de compatibilidad incluidos.
5. Confirma y publica la nueva versión. Espera a que el service worker nuevo se active y recarga la página.

**No borres** archivos históricos ni cambies a módulos ES6 los scripts clásicos del motor de Scouting. `233-vc20512-match-state-core.js`, `234-vc20512-match-state-adapters.js`, vídeo y demás archivos continúan siendo necesarios.

### ZIP `COMPLETO`

Contiene todo el código fuente y los scripts históricos, excepto `node_modules` y carpetas temporales de compilación. Mantén una copia de tus cambios locales antes de sustituir archivos.

### ZIP `PUBLICACION_VITE`

Es la salida `dist/` de publicación estática. No la mezcles indiscriminadamente con el repositorio fuente.

## Comprobaciones manuales tras publicar

1. Verifica que Scouting sigue registrando puntos y deshacer desde el teclado sin cambios de comportamiento.
2. Comprueba que el comparador V20.5.15 permanece visible en **Gestión** y responde a nuevas operaciones.
3. Comprueba el vídeo de un rally, la recuperación de alineaciones y el líbero después de deshacer.
4. Verifica sincronización, conflictos y reconexión con portátil y móvil reales.

## Próximo paso

Hacer pruebas end-to-end con escenarios más completos (vídeo, finalización de set/partido, correcciones, almacenamiento y recuperación) y obtener evidencia de sesiones reales. Solo entonces tendría sentido conectar el coordinador a una ruta de activación controlada con apagado seguro; no es prudente instalar un segundo escritor ni cambiar los botones antes de esas garantías.
