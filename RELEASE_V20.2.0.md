# Volley Coach V20.2.0 · Match Workspace Pro

**Base:** V20.1.2 completa. **Alcance:** diseño, navegación y consulta de datos reales del partido. **Sin cambios** en modelo de datos, Supabase, scoring, REC, vídeo y sincronización.

## Cambios funcionales

- Un solo menú principal de cinco modos operativos, conectado directamente al router `vc52SetMode`.
- Cabecera de partido con contexto de solo lectura: equipo, rival, set, rotación, rallies del set y acciones registradas en el rally activo.
- Historial desplegable de hasta cinco rallies guardados. Ganador sin registrar aparece como «Sin resultado». No se inventa tanteo ni marca temporal.
- Barra de trabajo unificada: conservados los controles originales de líbero, cambios, guardado, vídeo, pista, revisión y tres disposiciones de vídeo/código. Los selectores visuales redundantes de generaciones anteriores se ocultan solo cuando la nueva cabecera está disponible; no se eliminan sus handlers ni nodos.
- Diseño responsive y cohesionado con la identidad azul marino / azul eléctrico. El modo teatro del vídeo está expresamente fuera del alcance de los estilos nuevos.

## Protección de datos

La versión solo lee `VC_SCOUT_VIDEO_BRIDGE`, `getCurrentSet` y el modo `data-vc52-mode`; no hace escrituras, no clona el player, no sustituye el editor de código rápido, no genera rallies y no cambia el escritor CAS ni el diario durable.

## Pruebas

- 168 pruebas Node (incluidas 8 específicas de V20.2.0), aprobadas.
- Parseo sintáctico de 144 JS más 79 scripts internos de `index.html`, sin errores.
- Chromium aislado en escritorio y móvil: cabecera, 5 modos, navegación a Revisión, ausencia de errores JS y sin desbordamiento horizontal.
- Pendiente la prueba real con la aplicación completa publicada y dos dispositivos Supabase.

## Archivos de producción nuevos o modificados

- `index.html` (modificado)
- `service-worker.js` (modificado, caché con nueva versión)
- `212-vc2020-match-workspace.js` (nuevo)
- `vc2020-match-workspace.css` (nuevo)

La entrega completa incluye además `tests/v2020-match-workspace.test.cjs` y `tests/v2020-match-preview.html`. Continúan ausentes del ZIP de origen 11 CSS históricos; verificar su existencia en el repositorio remoto antes de cualquier eliminación.
