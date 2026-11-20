# Volley Coach V20.5.48 — Normalización avanzada de acciones

## Qué hemos consolidado

Dos pasos consecutivos de `scoutNormalizeAction` en el monolito de Scouting se convierten en **uno solo**, manteniendo el mismo normalizador de entrada:

- **V8.7:** tempo de ataque/colocación y sus equivalencias antiguas (`RAP`, `MED`, `ALT`), código de ataque, llamada del colocador, tipo de colocación, subtipo, código especial y código personalizado.
- **V8.8:** modo de pista, cono de destino, copias de coordenadas de origen/destino/contacto, zona de contacto, zonas DV, subzona, cono DV, acción de origen DV y fases tácticas.
- El módulo TypeScript `src/domain/scout-action-advanced-fields.ts` genera los **22 campos**, sin leer ni escribir estado del partido, vídeo, base de datos o nube.
- El resultado tipado se utiliza únicamente si **todos los campos** coinciden con la implementación nativa. Coordenadas válidas se contrastan por `x` e `y`; si faltan los puentes, aparecen campos diferentes, se lanzan excepciones o hay accesores especiales, permanece la proyección histórica.

La normalización del contacto y los metadatos tácticos V20.5.47 siguen funcionando. Los controladores nativos de `scoutPushAction`, puntos, rotaciones, líbero, deshacer, vídeo, REC/Delay, IndexedDB y CAS/Supabase **no se sustituyen** en esta entrega.

## Dónde se ve

En **Scouting → Scoutar → Scouting Speed Pro**, el indicador dice **«Registro y códigos avanzados · TypeScript · escritura nativa»** si están instalados los puentes esperados. Cuando falta alguno, mantiene el mensaje anterior de preparación y respaldo.

En la consola del navegador, `VC_SCOUT_ADVANCED_FIELDS_DIAGNOSTICS_20548()` muestra los contadores locales `typed`, `native`, `mismatches`, `exceptions`, sin nombres de jugadores, códigos ni datos de nube.

## Cómo instalarlo

1. Si tienes **V20.5.47**, descarga y descomprime `Volley_Coach_V20.5.48_SOLO_CAMBIOS.zip` y sustituye los archivos de la raíz del repositorio respetando sus carpetas.
2. Si necesitas reconstruir la versión de origen completa, usa `Volley_Coach_V20.5.48_COMPLETO.zip`.
3. Si publicas exclusivamente el sitio ya compilado, descomprime `Volley_Coach_V20.5.48_PUBLICACION_VITE.zip` en la raíz de publicación de GitHub Pages. No mezcles archivos de distintas versiones compiladas.
4. Espera al despliegue, recarga la PWA y comprueba los recursos `?v=20.5.48`.

## Pruebas y límites

Las pruebas comparan el módulo puro y el nuevo normalizador completo con las **dos funciones antiguas archivadas de V20.5.47**. Incluyen combinaciones de tempo/fundamento/subtipo/colocación, coordenadas válidas e inválidas, conos, metadatos de vídeo conservados, accesores, recuperación del motor nativo e identidad del objeto de acción.

La migración arquitectónica **sigue abierta**: quedan otras capas históricas y habrá que validar scouting de un partido completo, vídeo LIVE/Delay y sincronización real entre dos dispositivos antes de considerarla cerrada.
