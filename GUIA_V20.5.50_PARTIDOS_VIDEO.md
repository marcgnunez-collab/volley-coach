# Volley Coach V20.5.50 — Normalización del partido y vídeo

## Consolidación realizada

Al cargar los scoutings guardados, el motor antiguo instalaba dos envoltorios de `scoutNormalizeMatch` separados por una primera pasada de recuperación:

1. **V6.9:** normalizaba las configuraciones de flujo de trabajo del partido y marcaba su versión de datos.
2. **V6.10.0:** añadía al partido un contenedor de vídeo (`syncOffset`, `source`, `clips`) y convertía los tiempos de inicio y final de los rallies guardados.

En **V20.5.50** existe **un solo envoltorio** que mantiene esos dos momentos de activación. En la primera pasada solo aplica V6.9; al llegar al lugar original de instalación de V6.10.0 se habilita el vídeo antes de la segunda pasada. No se adelantan cambios sobre los partidos antiguos.

El módulo puro `src/domain/scout-match-video-container.ts`, construido con Vite, proyecta los **tres campos** del contenedor de vídeo. Su resultado se compara con la lógica nativa y se acepta solo cuando coincide. Mantiene la referencia al array de clips existente. Si faltan módulos, hay diferencias o la entrada contiene accesores especiales, se utiliza la ruta nativa.

Los tiempos de los rallies se siguen convirtiendo en el mismo orden y mediante el código nativo. El escritor de acciones, los mecanismos de puntuación, rotación, líbero, vídeo LIVE/Delay y la sincronización **no cambian**.

## Dónde comprobarlo

- En **Scouting → Scoutar → Scouting Speed Pro**, la preparación muestra **«Registro y vídeo de partido · TypeScript · escritura nativa»** si todos los puentes esperados están activos.
- La consola del navegador expone `VC_SCOUT_MATCH_VIDEO_DIAGNOSTICS_20550()`, con contadores locales `typed`, `native`, `mismatches`, `exceptions` y `videoEnabled`. No contiene datos del club ni del vídeo.

## Cómo actualizar

1. Si ya utilizas **V20.5.49**, descomprime `Volley_Coach_V20.5.50_SOLO_CAMBIOS.zip` y sube los archivos respetando su estructura de carpetas en la raíz de GitHub.
2. Usa `Volley_Coach_V20.5.50_COMPLETO.zip` para una instalación íntegra de código fuente.
3. Si publicas los archivos web ya compilados, emplea `Volley_Coach_V20.5.50_PUBLICACION_VITE.zip` en tu directorio público, sin mezclar partes compiladas de distintas versiones.
4. Deja terminar el despliegue y recarga la aplicación para actualizar la caché de la PWA (`?v=20.5.50`).

## Pruebas y límites

Las pruebas comparan contra **ambos envoltorios históricos archivados de V20.5.49** y sus dos pasadas de carga. Cubren clips y referencias, desplazamientos de vídeo, tiempos nulos o inválidos, conversiones de rallies, respaldo automático y acceso a campos mediante getters.

La migración general de `MatchState` y el flujo completo de vídeo/sincronización siguen pendientes de integración en campo. Las pruebas automáticas no equivalen a dos dispositivos físicos conectados ni a un partido real con grabación.
