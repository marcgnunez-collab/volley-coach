# Volley Coach V20.5.53 — Tiempos de vídeo por rally

## Avance de arquitectura

V7.0 instalaba una segunda versión de `scoutNormalizeRally` y, tras ejecutar el normalizador original, convertía dos valores de vídeo (`videoStart`, `videoEnd`) a números o `null`. Ahora existe **una única implementación de normalización del rally**.

Esta implementación añade ambos campos únicamente cuando el flujo de inicialización llega al mismo punto V7.0 que antes. En las pasadas anteriores conserva exactamente el comportamiento del normalizador V6.8. La actualización no adelanta conversiones en la recuperación de partidos antiguos.

`src/domain/scout-rally-video-bounds.ts` contiene la proyección pura TypeScript y se compila con Vite. Se compara en tiempo de ejecución con los dos resultados nativos y se acepta solo si sus valores son idénticos, incluyendo `NaN`, infinitos y `null`. La ruta histórica sigue como respaldo si no se carga el paquete, se devuelve un resultado inválido, hay discrepancias o los datos usan getters especiales.

**No se han modificado** las operaciones que asignan fotogramas a rallies, clips, los registros en directo, marcador, rotaciones, cierre manual, REC/Delay, edición de scouts, diario IndexedDB ni escritura de nube CAS/Supabase.

## Dónde comprobarlo

- En **Scouting → Scoutar → Scouting Speed Pro**, con los puentes activos, el indicador muestra **«Registro, tiempos de rally y vídeo · TypeScript · escritura nativa»**.
- El diagnóstico técnico `VC_SCOUT_RALLY_VIDEO_DIAGNOSTICS_20553()` incluye `typed`, `native`, `mismatches`, `exceptions` y `videoEnabled`. Es local, sin datos privados.
- En un scouting con vídeo, comprueba que puedas reabrir un partido, navegar al comienzo y final de rallies y conservar correctamente las marcas temporales después de guardarlo.

## Instalación

1. Sobre **V20.5.52**, descomprime `Volley_Coach_V20.5.53_SOLO_CAMBIOS.zip` y sube su **contenido**, manteniendo carpetas, a la raíz de GitHub.
2. Para toda la fuente, utiliza `Volley_Coach_V20.5.53_COMPLETO.zip`.
3. Para desplegar el resultado compilado, utiliza `Volley_Coach_V20.5.53_PUBLICACION_VITE.zip` sin mezclar otros builds.
4. Espera al despliegue y recarga la aplicación para que la PWA obtenga los recursos `?v=20.5.53`.

## Verificación y límites

Las pruebas comparan el normalizador original y el envoltorio de V7.0, ambos **archivados sin cambios desde V20.5.52**, contra el nuevo código. Cubren 1.000 combinaciones de tiempos, estados y acciones; comprueban orden de campos, activación por fases, respaldo ante fallos y número de lecturas de getters.

La arquitectura TypeScript/Vite sigue en migración progresiva. La comprobación automatizada no sustituye las pruebas en pabellón con grabación real, dispositivo secundario y conexión intermitente.
