# Volley Coach V20.5.54 — Normalizador de partido unificado por fases

## Cambio de estructura

`scoutNormalizeMatch` estaba asignado tres veces en el motor de scouting: una implementación base V6.8 y dos envoltorios históricos V6.9 y V6.10.2. La V20.5.54 integra el de V6.10.2 en el primero. **Sigue existiendo el normalizador base y una sola reasignación posterior**, en lugar de dos.

La unión **no adelanta ningún comportamiento**:

1. **V6.9:** se conserva la normalización del flujo de partido (`workflow`).
2. **V6.10.0:** se activa el contenedor de vídeo y la conversión histórica de los tiempos de rallies guardados.
3. **V6.10.2:** se activan los campos de cierre/reapertura y se realiza la misma pasada de normalización de partidos ya guardados.
4. **V7.0:** se conserva el momento de activación de los metadatos de vídeo, su ancla, los clips y las asignaciones temporales.
5. **V8.6.1:** se mantiene la conservación del resultado manual por set y del partido.

El nuevo módulo puro `src/domain/scout-match-finalization-fields.ts`, compilado con Vite, proyecta `manualSavedAt`, `reopenedAt`, `finalizedByUser`, `resultComplete` y `resultCompleteAt`. Sus resultados se comparan campo por campo con los originales; si falta el paquete, aparecen getters especiales, existen diferencias o se produce una excepción, el normalizador conserva el resultado nativo.

El cambio no introduce nuevos escritores de estado ni modificaciones de formato en IndexedDB/Supabase. Los puntos, las rotaciones, el líbero, la recuperación, el cierre manual, REC/Delay y el reproductor siguen usando los mecanismos históricos.

## Cómo verificarlo

- En **Scouting → Scoutar → Scouting Speed Pro** aparece **«Registro y estado final del partido · TypeScript · escritura nativa»** cuando todos los puentes están disponibles.
- El diagnóstico `VC_SCOUT_MATCH_FINALIZATION_DIAGNOSTICS_20554()` devuelve contadores locales `typed`, `native`, `mismatches`, `exceptions` y `finalizationEnabled`, sin información identificativa del club.
- Para validar el caso real, guarda un scouting, reábrelo y comprueba que persisten los datos de cierre, los rallies, los vídeos vinculados y la puntuación original. Realiza también una comprobación con dos dispositivos y conexión intermitente.

## Actualización

1. Si ya tienes **V20.5.53**, descomprime `Volley_Coach_V20.5.54_SOLO_CAMBIOS.zip` y sube **su contenido** a la raíz GitHub, conservando la estructura de carpetas.
2. Si necesitas todo el código fuente, utiliza `Volley_Coach_V20.5.54_COMPLETO.zip`.
3. Para servir la aplicación compilada, utiliza `Volley_Coach_V20.5.54_PUBLICACION_VITE.zip` en la raíz pública, sin mezclar builds.
4. Espera el despliegue y vuelve a abrir la aplicación para renovar la caché PWA (`?v=20.5.54`).

## Pruebas y límites

La nueva batería utiliza **los dos envoltorios originales archivados desde V20.5.53** y compara su comportamiento con la única función actual. Comprueba las cinco fases de activación, 1.280 combinaciones de fechas/estado/cierre con vídeo y resultados manuales, identidad del objeto normalizado, orden de propiedades, respaldo y lecturas de getters. Los módulos V20.5.50–V20.5.53 conservan sus propias regresiones.

Esto completa una consolidación importante, pero **no es todavía una migración total del motor de scouting a TypeScript**. Antes de considerar la arquitectura definitiva, siguen pendientes la integración completa del estado, las escrituras transaccionales y una prueba prolongada de campo.
