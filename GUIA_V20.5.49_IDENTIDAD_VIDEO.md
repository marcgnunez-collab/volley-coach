# Volley Coach V20.5.49 — Consolidación de identidad y vídeo de acciones

## Qué cambia

El motor histórico instala dos capas de normalización de acciones en distintos momentos:

1. **V6.9:** `uid` de la acción, `videoStart`, `videoAction`, `videoEnd` y `clipId`.
2. **V6.10.0:** `opponentPlayerUid`, identificador estable del jugador rival.

La V20.5.49 elimina el segundo envoltorio de `scoutNormalizeAction` y reúne estos **seis campos** en un solo cálculo puro TypeScript (`src/domain/scout-action-identity-fields.ts`). Antes de utilizarlo se contrasta **cada campo** con el resultado del normalizador nativo y, ante errores o diferencias, gana siempre la ruta histórica.

### Por qué conservamos dos momentos de activación

Al iniciar la aplicación, el Scouting normaliza partidos guardados tras instalar V6.9 y vuelve a normalizarlos al instalar V6.10.0. Mover ambos campos al segundo momento o aplicarlos todos desde el primero puede cambiar el proceso de recuperación.

Por eso el envoltorio compartido **empieza con los cinco campos de V6.9** y habilita `opponentPlayerUid` en el **mismo punto exacto** donde antes se instalaba el segundo envoltorio. Así preserva los dos pasos sin encadenar un segundo normalizador de acciones.

## Dónde se ve

1. Abre **Scouting → Scoutar → Scouting Speed Pro**. Con los puentes activos, la preparación muestra **«Registro, identidad y vídeo · TypeScript · escritura nativa»**.
2. Opcionalmente, ejecuta `VC_SCOUT_IDENTITY_FIELDS_DIAGNOSTICS_20549()` en la consola del navegador. Verás `typed`, `native`, `mismatches`, `exceptions` y `opponentEnabled`. Son contadores locales, sin datos de jugadores ni imágenes.

## Actualización en GitHub

- Si tienes **V20.5.48**, descomprime `Volley_Coach_V20.5.49_SOLO_CAMBIOS.zip` y sube todos los archivos respetando sus carpetas, reemplazando los existentes.
- Si necesitas el código fuente íntegro, utiliza `Volley_Coach_V20.5.49_COMPLETO.zip`.
- Para desplegar solo la distribución compilada de Vite, publica el contenido de `Volley_Coach_V20.5.49_PUBLICACION_VITE.zip` en tu directorio público, sin mezclar compilaciones de distintas versiones.
- Deja terminar el despliegue y recarga la PWA para recibir los recursos `?v=20.5.49` y la caché renovada.

## Seguridad y pruebas

Las pruebas automatizadas comparan contra los dos envoltorios originales de **V20.5.48**, tanto antes como después de la activación de V6.10.0. Cubren campos ausentes, vídeos sin tiempo o con datos inválidos, identificadores históricos, accesores y fallos de TypeScript. Se mantiene una sola llamada al normalizador base y el mismo objeto de acción.

**No se han migrado** los escritores de puntos, partidos, vídeos, diario IndexedDB o nube. La validación automática no sustituye las pruebas reales de vídeo y sincronización PC/móvil en un partido.
