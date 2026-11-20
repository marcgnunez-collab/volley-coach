# Volley Coach V20.5.45 · Metadatos de acciones y vídeo en TypeScript

**Actualización sobre V20.5.44.** Se migra una nueva parte del motor de scouting, manteniendo los escritores y la captura de vídeo existentes.

## Qué se ha consolidado

Un único módulo puro, `src/domain/scout-action-metadata.ts`, calcula tres proyecciones utilizadas por el scouting:

1. **Datos Data Volley:** zona de contacto, origen/destino, subzona, cono, referencia a la acción anterior y fases de Sideout/Breakpoint/Reception/Transition.
2. **Tiempo mostrado en el editor e historial:** prioridad histórica `videoTimestamp → liveVideoTime → videoAction → videoTime`, aceptando solo tiempos válidos y no negativos.
3. **Tiempo normalizado al registrar:** respeta la prioridad anterior del editor V13.2: timestamp explícito, tiempo de cámara LIVE, acción de vídeo y tiempo del vídeo, con valor negativo ajustado a cero cuando corresponda.

El módulo se instala mediante `src/domain/scout-action-metadata-runtime.ts` y se compara en ejecución con los cálculos antiguos. Si la versión TypeScript no está disponible, devuelve un valor diferente o falla, **se conserva el resultado nativo**. La comparación es anónima: no almacena vídeo, nombres, códigos ni identidades.

## Qué no se ha modificado

- Inicio/parada de cámara, REC, búfer LIVE/Delay, asociación de sesiones y reconexión QR/WebRTC.
- Registro único de acciones, `scoutSave`, diario IndexedDB y sincronización CAS/Supabase.
- Referencias `videoExactSourceKey`, `videoTime`, `videoTimestamp`, `clipId`, `scoutMs` y marcas de vídeo existentes.
- Marcador, rotaciones, puntuación, edición/deshacer y exportaciones.
- El código `028-v740-live-scout-video-module.js`, responsable de marcar las acciones durante una sesión de cámara, se conserva sin modificaciones.

La función nativa V8.8 que consulta las jugadas anteriores sigue siendo la referencia de paridad; el cálculo tipado es solo una proyección de datos, **no un segundo motor de grabación ni de estado**.

## Dónde verlo

En **Scouting → Scoutar → Scouting Speed Pro**, la etiqueta de extensiones muestra:

**«Parser, códigos y metadatos · TypeScript».**

Para diagnóstico técnico están disponibles `VC_SCOUT_DV_METADATA_DIAGNOSTICS_20545()` y `VC_SCOUT_VIDEO_METADATA_DIAGNOSTICS_20545()`. Solo ofrecen contadores agregados de coincidencias, uso del respaldo y fallos.

## Pruebas y límite de esta versión

Los selectores originales V20.5.44 están archivados en `test-audit/fixtures/v20544-action-metadata.txt`. Las pruebas comparan habilidades, equipos, fases, subzonas, conos, referencias al saque/ataque anterior y prioridades temporales con tiempos negativos, vacíos, inválidos y precisos.

**No se ha probado un partido real ni una sesión REC/Delay con dos dispositivos:** antes de usar esta entrega en competición, comprueba que la grabación sigue continua, que revisar un rally no mueve la cámara a LIVE, que los tiempos conducen al fotograma correcto y que el marcador histórico no inventa tanteos. La sincronización real entre móvil y portátil también necesita validación en la web publicada.

## Publicación en GitHub

| ZIP | Uso |
| --- | --- |
| `Volley_Coach_V20.5.45_SOLO_CAMBIOS.zip` | Actualizar V20.5.44 conservando los demás archivos. |
| `Volley_Coach_V20.5.45_COMPLETO.zip` | Código fuente completo y pruebas. |
| `Volley_Coach_V20.5.45_PUBLICACION_VITE.zip` | Distribución compilada para desplegar como web. |

Descomprime el paquete adecuado, respeta rutas, sustituye únicamente archivos homónimos y **no borres archivos ni copias locales**. Haz antes una copia JSON y, tras publicar, recarga con `Ctrl + F5`.
