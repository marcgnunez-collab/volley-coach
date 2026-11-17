# Volley Coach V19.3.19.7 · Global UI & Performance Optimization

Base exacta: `Volley_Coach_V19.3.19.6_COMPLETO.zip`.

## Implementado

- `vc193197-global-ui-optimization.css`: capa visual reversible cargada al final para una misma familia tipográfica y escala cromática en Inicio, Club/plantillas, Entrenamientos, Partido, Análisis, Video Studio, Banquillo e Informes. Unifica superficies, cabeceras, bordes, filtros, tablas, estados de foco y ajustes móviles.
- `index.html`: añade **solo** el enlace a la nueva hoja visual. El DOM, la navegación, los eventos y los scripts de scouting siguen iguales.
- `service-worker.js`: avanza la versión de caché e incluye la hoja nueva. Durante la precarga limita la concurrencia a seis recursos. Mantiene caché de red primero, exclusión de Supabase/API y tolerancia a archivos opcionales no disponibles.

## Sin cambios

No hay cambios en los modelos de datos, scoring, protección de rally, motor de vídeo, conexión WebRTC, reglas de Delay, presencia de dispositivos, estadísticas, Supabase, estructura de tablas ni importación/exportación.

## Validación

- 121 pruebas automatizadas (`node --test tests/*.test.cjs`).
- Sintaxis de 139 JS y 79 scripts internos de index.html: OK.
- CSS analizado sin errores de sintaxis.
- Chromium, previsualización **aislada** a 1366 y 390 píxeles: sin desplazamiento horizontal en el fixture. La previsualización no es una captura de toda la app.
- Prueba de servicio de caché con respuestas simuladas: máximo seis peticiones paralelas; un CSS opcional ausente no bloquea la instalación.
- Todos los archivos históricos no modificados se compararon con V19.3.19.6; coinciden byte a byte.

## Limitaciones, riesgos y trabajo pendiente

- La aplicación completa local no se pudo abrir en Chromium (ERR_BLOCKED_BY_ADMINISTRATOR). Es imprescindible una revisión funcional en GitHub Pages y equipos reales.
- El ZIP de origen trae referencias a 11 CSS no incluidos: `vc19-workflow.css`, `vc1924-clip-studio.css`, `vc1920-connection-hub.css`, `vc1922-live-delay.css`, `vc1923-video-scout-links.css`, `vc1925-library-health.css`, `vc1930-tactical-rivals.css`, `vc1937-analysis-main.css`, `vc1938-data-engine.css`, `vc1939-rally-search.css`, `vc19310-professional-analysis.css`. Se conservan las referencias para no eliminar estilos genuinos que puedan existir ya en tu GitHub. No se han inventado sustitutos.
- La reestructuración visual es de presentación. No se ha ejecutado una limpieza destructiva de los módulos históricos ni una migración de datos.
- No se han medido mejoras reales de velocidad en dispositivos. Limitar precargas concurrentes reduce el pico de solicitudes simultáneas, no garantiza una carga total más rápida.

## Reversión

Restituir `index.html` y `service-worker.js` de V19.3.19.6 y eliminar `vc193197-global-ui-optimization.css` cuando no lo utilicen otras versiones. No es necesario revertir datos.
