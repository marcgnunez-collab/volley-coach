# Volley Coach V20.5.51 — Estado final y metadatos de vídeo

## Qué se ha consolidado

Se elimina la segunda reasignación histórica de `scoutNormalizeMatch` correspondiente a V7.0. Los dos bloques anteriores se reúnen en **un único envoltorio**:

1. **V6.10.2:** conserva los campos de cierre y reapertura del scouting (`manualSavedAt`, `reopenedAt`, `finalizedByUser`, `resultComplete`, `resultCompleteAt`).
2. **V7.0:** cuando llega su fase de carga original, completa los 11 campos del vídeo: desplazamiento, fuente, tamaño, fecha del archivo, MIME, duración, sincronización, ancla, pre-roll, post-roll y clips.

La fase V7.0 **no se adelanta**: continúa activándose dentro del módulo de vídeo, antes de la misma normalización de partidos guardados y su posterior asignación de tiempos. Su identificador de versión se entrega al envoltorio compartido sin exponer el estado privado del reproductor.

El cálculo puro de V7.0 está ahora en `src/domain/scout-match-video-overlay.ts` y se compila con Vite. Cada resultado TypeScript se contrasta con los once campos nativos; si falta el puente o difieren los datos, se usa el resultado histórico. Se mantienen las referencias a los clips y al ancla de sincronización cuando existen.

**No se han sustituido** las escrituras de Scouting, los puntos, las rotaciones, los clips, REC/Delay, la asignación de tiempos al vídeo, el diario de IndexedDB ni el motor de sincronización CAS/Supabase.

## Dónde aparece

- En **Scouting → Scoutar → Scouting Speed Pro**, con los puentes activos, se muestra **«Registro y vídeo avanzado · TypeScript · escritura nativa»**.
- El diagnóstico `VC_SCOUT_VIDEO_OVERLAY_DIAGNOSTICS_20551()` muestra contadores locales `typed`, `native`, `mismatches`, `exceptions` y `videoEnabled`. No expone nombres de jugadores, archivos ni direcciones de nube.

## Actualización

1. Sobre **V20.5.50**, descarga `Volley_Coach_V20.5.51_SOLO_CAMBIOS.zip`, descomprímelo y sube su contenido manteniendo las carpetas a la raíz del repositorio GitHub.
2. Para el proyecto fuente completo, usa `Volley_Coach_V20.5.51_COMPLETO.zip`.
3. Para un despliegue de los archivos compilados, utiliza `Volley_Coach_V20.5.51_PUBLICACION_VITE.zip` en la raíz pública, sin mezclar compilaciones de distintas versiones.
4. Espera al despliegue y recarga la PWA para actualizar los recursos `?v=20.5.51`.

## Pruebas y límites

Las pruebas comparan el código actual con **las dos funciones originales archivadas de V20.5.50**, antes y después de activar V7.0. Cubren 1.200 combinaciones de tiempos, archivo, anclas, clips y preroll; verifican el orden de campos, la identidad de referencias, la recuperación nativa ante errores y que el estado del partido mantiene su normalizador base único.

La migración arquitectónica completa sigue pendiente. Estas pruebas son automatizadas y no sustituyen una sesión real de vídeo con REC/Delay y dos dispositivos sincronizados.
