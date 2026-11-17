# Volley Coach V19.3.17 · Video Montage Pro

Base exacta: ZIP completo V19.3.16.3. Sin sustitución de los módulos V19.3.15, V19.3.16, V19.3.16.1 ni V19.3.16.3.

## Mejoras

- Pestaña **Análisis → Video Montage** dentro de Analysis Pro.
- Reutiliza físicamente el reproductor `v780-video-frame` / `v780-player-video` de Video Review, mediante el dock existente de V19.3.14; no crea un segundo reproductor.
- Montajes almacenados en `match.videoMontages` mediante `VC_SCOUT_VIDEO_BRIDGE.save()`. No se copian los vídeos, acciones, puntos ni los registros de scouting.
- Crear, renombrar, seleccionar y eliminar montajes de un partido.
- Añadir rallies con rango de vídeo **disponible** (sin inferir tiempos), clips del catálogo V19.2 y jugadas de playlists tácticas existentes.
- Timeline: seleccionar, duplicar, reordenar, quitar, editar IN/OUT y velocidades 0,5× / 1× / 1,5×.
- Anotaciones por segmento: flecha, línea, rectángulo, círculo, trazo a mano alzada, texto sobre pista y título/superposición. Deshacer y borrar dibujos.
- Previsualización de clip o montaje en el reproductor original.
- Exportación **real** de montaje WebM y clip individual WebM con dibujos/títulos, utilizando Canvas captureStream + MediaRecorder cuando están disponibles. Máximo 10 minutos por exportación. La captura se realiza en tiempo real y requiere dejar visible la pestaña.
- Exportación de plan JSON y lista de cortes EDL CSV (sin archivo de vídeo, útiles si WebM no está disponible).
- Protección de guardado frente a un partido sustituido por una actualización externa.
- Caché del service worker versionada para V19.3.17.

## Acceso

Abrir un scouting en **Análisis → Video Montage**. Cargar un vídeo local de ese partido si no se ha abierto. Crear un montaje. Añadir rallies, clips del catálogo o una playlist. Seleccionar un segmento para editarlo, colocar dibujos o título y exportar.

## Limitaciones comprobadas

1. **No equivale plenamente a Data Volley 4**. Se incluyen sus flujos principales de montaje, sin búsqueda multicampeonato, importación de clips de diferentes partidos en una misma línea de tiempo ni exportación MP4 transcoding universal.
2. La exportación WebM solo admite vídeos locales accesibles por el navegador. YouTube, streaming remoto con CORS restrictivo, LIVE y Delay temporal no son compatibles con esta exportación.
3. El audio se incluye si el navegador expone una pista de audio capturable. La ausencia de esa pista produce WebM sin sonido. Conviene reproducir y verificar el archivo exportado.
4. El guardado de metadatos usa la ruta ya existente de scouting, cuyo consolidado/cloud es asíncrono. Aún no se han probado cargas simultáneas reales PC-móvil-Supabase ni conflictos remotos.
5. La validación de vídeo es una **prueba aislada de navegador con un archivo sintético**, no la apertura integral de la aplicación con una sesión de club real.
6. El ZIP heredado contenía 11 referencias a CSS no aportados; se conserva el estado anterior, sin agregar hojas falsas. El nuevo módulo sí incluye su propia hoja de estilos real.
7. Los proyectos guardan los intervalos tal como se eligieron; si cambian las referencias de sincronización, deben revisarse antes de generar un nuevo vídeo.

## Pruebas

- `node --test tests/*.test.cjs`: 42/42 pruebas aprobadas.
- `python tests/smoke_v19317_montage.py`: Chromium aislado. Crear montaje, añadir rally, texto, dibujar, guardar, exportar WebM, importar playlist original, reordenar y restaurar reproductor: aprobado.
- `ffprobe` / `ffmpeg`: WebM resultante con VP9 y fotogramas decodificables, incluida superposición de texto y flecha.
- Sintaxis de todos los archivos JS y scripts inline de `index.html` verificada antes de empaquetar.

## Archivos modificados

- `index.html` (inclusión del nuevo módulo y versión del enrutador).
- `191-vc19310-professional-analysis-architecture.js` (nueva pestaña y acoplamiento).
- `service-worker.js` (nueva versión de caché y recursos del montaje).

## Archivos añadidos

- `199-vc19317-video-montage-pro.js`
- `vc19317-video-montage-pro.css`
- `tests/v19317-video-montage.test.cjs`
- `tests/smoke_v19317_montage.py`
- `tests/v19317-synthetic.webm` (material sintético para la prueba, no vídeo de usuario)
- `GUIA_VIDEO_MONTAGE_V19.3.17.md`
- `RELEASE_V19.3.17.md`

## Instalación

- **Desde V19.3.16.3 completa:** extraer ZIP Solo cambios sobre la raíz del repositorio conservando rutas; revisar en GitHub los archivos nuevos, especialmente el `199-...js` y el `.css`.
- **Desde versiones más antiguas o la V19.3.16.2:** utilizar el ZIP completo de V19.3.17 para no perder las mejoras de V19.3.15–V19.3.16.3.
- Antes de sobrescribir, exportar los scoutings/estado y hacer copia del repositorio. No borrar archivos no presentes en el ZIP de cambios.
- Esperar la recarga del service worker y confirmar que aparece la pestaña **Video Montage**.
