# Volley Coach V20.5.47 — Consolidación de normalización táctica

## Qué cambia

- La cadena histórica V8.3 → V8.4 que normalizaba **dirección de ataque**, **tipo de saque recibido** y **dorsal/etiqueta del objetivo del bloqueo** se convierte en un único envoltorio nativo en `021-core-scouting-v150-monolithic.js`.
- `src/domain/scout-action-tactical-fields.ts` calcula de forma pura los cinco campos: `attackDirection`, `receivedServeType`, `serveType`, `blockTargetNumber` y `blockTargetLabel`. El módulo se construye con Vite.
- Se contrasta el resultado completo con la misma lógica histórica. El módulo solo toma el relevo cuando coinciden **todos los valores**; de lo contrario, se utiliza el resultado nativo sin modificar el flujo del partido.
- Se mantienen las inferencias de recepción (`v830InferReceptionMeta`), bloqueo (`v840InferBlockTarget`), la construcción de códigos, el registro y los datos existentes.

## Dónde comprobarlo

1. Entra en **Scouting → Scoutar → Scouting Speed Pro** y observa el indicador de preparación: **«Registro, recepción y bloqueo · TypeScript · escritura nativa»** cuando los puentes están activos.
2. En la consola de desarrollador puedes consultar **`VC_SCOUT_TACTICAL_FIELDS_DIAGNOSTICS_20547()`**. Devuelve solo contadores locales: `typed`, `native`, `mismatches` y `exceptions`. No muestra datos de jugadores ni los transmite.
3. Prueba una recepción asociada a un saque `JF` y un bloqueo con dorsal de objetivo, además de un ataque con dirección. Revisa los códigos y las estadísticas posteriores.

## Instalación en GitHub Pages

Si actualizas sobre **V20.5.46**, descomprime **`Volley_Coach_V20.5.47_SOLO_CAMBIOS.zip`** en la raíz del repositorio y acepta reemplazar los archivos incluidos. Si no estás seguro de la versión, utiliza **`Volley_Coach_V20.5.47_COMPLETO.zip`**.

Para publicar exclusivamente el resultado compilado de Vite, utiliza **`Volley_Coach_V20.5.47_PUBLICACION_VITE.zip`** en la raíz pública, manteniendo la estructura de carpetas del ZIP. No mezcles la publicación Vite con versiones previas de los módulos.

Comprueba que en el sitio desplegado aparece la versión de los recursos `?v=20.5.47`. Si la PWA estaba instalada, recarga y deja que el nuevo service worker actualice la caché.

## Pruebas y límites

- Las pruebas comparan el módulo tipado y el único envoltorio actual contra **las dos funciones originales archivadas de V20.5.46**, incluyendo 1.800 combinaciones de fundamentos y campos tácticos, recepción con `serveType` legado, bloqueos y situaciones de respaldo.
- Se comprueba que no aparezca un segundo escritor y que los archivos canónicos de estado conserven sus sumas SHA-256.
- **Esta versión no cambia** marcador, rotaciones, deshacer, líbero, red, diario de recuperación, CAS/Supabase, vídeo, REC/Delay ni el almacenamiento local.
- No significa que la migración total a TypeScript esté terminada. Las pruebas automáticas no reemplazan una sesión real de scouting/vídeo ni una prueba de sincronización entre dos dispositivos.
