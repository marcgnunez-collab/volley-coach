# Volley Coach V20.5.52 — Cierre manual de sets y resultado final

## Qué cambia en la arquitectura

El normalizador de partidos tenía un envoltorio independiente de **V8.6.1** para conservar los marcadores manuales al guardar, reabrir o recuperar un scouting. Esta versión suprime esa reasignación y la integra en el normalizador compartido de V6.10.2/V7.0. La activación continúa exactamente en la fase V8.6.1: no aparecen campos nuevos antes de ese momento.

La nueva proyección pura de TypeScript (`src/domain/scout-match-manual-result.ts`) cubre:

1. Por set: `manualFinished`, `manualFinishedAt` y `manualScorePrevious` (puntuaciones local/rival antes del cierre).
2. Por partido: `manualFinalResult.active`, resultados de ambos equipos y fechas `savedAt`, `finalizedAt`, `clearedAt`.
3. Asociación por número de set, manteniendo la búsqueda y el respaldo por índice del normalizador original.

El código nativo calcula el mismo resultado; el módulo Vite/TypeScript solo se utiliza si sus valores coinciden estrictamente. Cuando falta el módulo, devuelve otra forma, falla o detecta accesores especiales, se usa el cálculo histórico. Los campos se aplican al **mismo objeto de partido**, conservando el orden de propiedades y la estructura de sets.

Se mantienen nativos el mecanismo de cierre/reapertura, los botones de resultado final, los sets y rallies reales, la valoración de estadísticas, el marcador, rotaciones, líbero, vídeo, REC/Delay, IndexedDB y la nube CAS/Supabase.

## Cómo comprobarlo

- En **Scouting → Scoutar → Scouting Speed Pro** aparece **«Registro, vídeo y cierre manual · TypeScript · escritura nativa»** cuando están disponibles los puentes esperados.
- El diagnóstico técnico `VC_SCOUT_MANUAL_RESULT_DIAGNOSTICS_20552()` devuelve los contadores `typed`, `native`, `mismatches`, `exceptions` y `manualEnabled`. No contiene datos de jugadores ni nombres de vídeos.
- Si cierras un set manualmente, guardas el scouting y lo reabres, deben conservarse el cierre y el marcador anterior. Si estableces un resultado final manual, también debe persistir. Al reabrir, comprueba que las estadísticas técnicas continúen usando los rallies reales.

## Instalación

1. Si ya tienes la **V20.5.51**, descomprime `Volley_Coach_V20.5.52_SOLO_CAMBIOS.zip` y sube **su contenido**, respetando carpetas, a la raíz del repositorio GitHub.
2. Si necesitas toda la fuente actualizada, usa `Volley_Coach_V20.5.52_COMPLETO.zip`.
3. Para desplegar solo la aplicación compilada, utiliza `Volley_Coach_V20.5.52_PUBLICACION_VITE.zip`, sin mezclar archivos de versiones distintas.
4. Espera a que termine el despliegue y recarga la PWA para actualizar los recursos `?v=20.5.52`.

## Pruebas y límites

La regresión V20.5.52 ejecuta el envoltorio V8.6.1 **archivado desde V20.5.51** contra el nuevo normalizador. Incluye 1.200 combinaciones de cierre de set, marcador previo, fechas, resultado manual y orden de sets; además comprueba activación por fases, identidad del objeto, respaldo ante fallos y conservación de lecturas de getters.

La arquitectura Vite/TypeScript es aún **progresiva**, no una sustitución completa del runtime. Es necesario validar en un partido real el cierre manual, vídeo y sincronización entre PC y móvil antes de depender de esta versión en competición.
