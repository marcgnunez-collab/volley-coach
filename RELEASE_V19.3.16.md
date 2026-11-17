# Volley Coach V19.3.16 · Smart Scouting & Match Reliability Pro

**Base exacta:** `Volley_Coach_V19.3.15_COMPLETO.zip` facilitado en esta conversación. Esta versión mantiene los módulos existentes y el esquema de scouting original. No introduce una segunda base de datos, una nueva tabla Supabase ni un mecanismo alternativo de puntuación.

## Implementación

1. **Smart Rally (solo lectura):** en Análisis → Video Analysis, el panel de la jugada seleccionada muestra relaciones plausibles S→R, R→E, E→A y A→B usando el orden y el equipo de los contactos originales. Cada relación es evidencia de secuencia, no una confirmación táctica ni un nuevo contacto. No se inventan resultados de rallies incompletos. Para relaciones sin identificadores originales estables, se advierte explícitamente.
2. **Codificación rápida en el editor:** botones de valoración `# + ! - / =`, atajos `Alt+1` a `Alt+6`, `Alt+↑/↓` para desplazarse entre contactos, junto con los atajos ya existentes `Ctrl/Cmd+Enter` para guardar y Escape para cancelar. Todos cambian el **borrador**, no el partido hasta pulsar Guardar. El parser original debe aceptar el código resultante.
3. **Pista 9×4 en Scouting Editor Pro:** 9 zonas × 4 cuadrantes según el orden ya empleado en el scouting (`4,3,2 / 7,8,9 / 5,6,1`). Dentro de cada zona: **C arriba izquierda, B arriba derecha, D abajo izquierda, A abajo derecha**. Marca origen y luego destino; para recepción/defensa se marca el contacto y para bloqueo el origen. Rechaza sustituir silenciosamente una localización por cono. Se conserva la semántica de campos del motor original.
4. **Estadísticas:** las ediciones guardan por el puente original V19.3.15; se invalidan cachés y se actualizan estadísticas y vistas. K1/K2 siguen dependiendo de los datos **registrados** de servicio/ganador, no de relaciones inferidas. No se modifican automáticamente puntos, servicio, rotaciones, marcas de reloj ni fuentes de vídeo.
5. **Integridad/concurrencia:** el editor rechaza guardados si cambian las acciones originales, la revisión `updatedAt` del partido o los campos protegidos de puntuación/reloj mientras está abierto. Se conserva la reversión del V19.3.15 si falla el guardado local. Una sincronización en nube pendiente NO se presenta como subida completada.
6. **Auditoría en Video Analysis:** incidencias del motor canónico (ID repetidos, campos sin identificar, zonas inválidas) y comprobación de incrementos de tanteo **solo si el registro está completo**. Incluye comprobación de marcas de scouting fuera de orden. Muestra si existen los mecanismos locales de guardado y flush, pero **no verifica la nube**.

## Instalación en GitHub Pages

1. **Antes de desplegar, exportar las copias JSON** de scoutings tanto desde el PC como desde el móvil. Conservar ambas y resolver discrepancias previas.
2. Subir el contenido de la carpeta `volley-coach-main` del ZIP completo, o sustituir en la raíz del repositorio exactamente las rutas del ZIP `SOLO_CAMBIOS` (manteniendo la estructura). **No borrar recursos antiguos que no estén en el ZIP.**
3. Esperar a que la publicación del sitio esté realmente completada y abrir una versión recargada en ambos dispositivos. El service worker utiliza una clave de caché nueva.
4. En Análisis → Video Analysis, seleccionar un partido, un rally y una acción. Abrir **Editar** y usar los botones rápidos y la pista 9×4. Comprobar que no hay modificación hasta pulsar **Guardar y recalcular**.
5. Verificar que cambian las estadísticas correspondientes, pero no el tanteo histórico, las rotaciones ni los tiempos del scouting, y que funciona el mismo archivo/grabación de vídeo.
6. **Prueba de campo imprescindible, NO ejecutada aquí:** mismo scouting en PC y móvil con cuenta y sincronización real, guardar en un dispositivo, comprobar recepción exacta en el otro; invertir dispositivos; repetir con rally nuevo, eliminación y desfase de red. Revisar contador de dispositivos y conflictos, exportar datos y comparar IDs/códigos/tanteos antes y después.
7. Probar un partido real completo: 5 sets si es posible, rotaciones R1–R6, dos líberos si el partido los utiliza, cambios, cierre/reapertura, Delay, clips y reconstrucción desde JSON. **No se considera validado en producción sin este paso.**

## Comprobaciones realizadas

- `node --check`: 129 archivos JS, 79 scripts inline de `index.html`, cero errores.
- `node --test tests/v19315-editor.test.cjs tests/v19316-smart-scouting.test.cjs`: **21 pruebas aprobadas**.
- `python tests/smoke_v19315_playwright.py`: pruebas aisladas de edición avanzada, marca de vídeo, estadística, conflicto y rollback: OK.
- `python tests/smoke_v19316_playwright.py`: prueba aislada en Chromium de la pista 36 cuadrantes, botones rápidos, atajos, guardado simulado, cambio de estadísticas, preservación del marcador y rechazo de cambios concurrentes: OK.
- La apertura de la aplicación completa en Chromium (archivo o servidor HTTP local) ha sido bloqueada en este entorno (`ERR_BLOCKED_BY_ADMINISTRATOR`). **No se ha probado aquí el flujo completo de la aplicación, vídeo real, Supabase ni una sesión con dos dispositivos.**

## Dependencia heredada de V19.3.15

El ZIP de origen continúa sin incluir **11 CSS** a los que `index.html` ya hacía referencia: `vc19-workflow.css`, `vc1920-connection-hub.css`, `vc1922-live-delay.css`, `vc1923-video-scout-links.css`, `vc1924-clip-studio.css`, `vc1925-library-health.css`, `vc1930-tactical-rivals.css`, `vc1937-analysis-main.css`, `vc1938-data-engine.css`, `vc1939-rally-search.css`, `vc19310-professional-analysis.css`. No se han creado CSS vacíos ni se han eliminado referencias a archivos que podrían existir en el repositorio publicado. **Antes de sustituir completamente el sitio, conservar o recuperar los archivos CSS auténticos.**

## Archivos de desarrollo afectados

- `197-vc19316-smart-scouting.js` (nuevo)
- `vc19316-smart-scouting.css` (nuevo)
- `196-vc19315-scouting-editor-pro.js` (integración editor, controles de concurrencia)
- `195-vc19314-integrated-video-workspace.js` (panel Smart Rally, auditoría)
- `191-vc19310-professional-analysis-architecture.js` (activación y actualización)
- `index.html` (carga y versión)
- `service-worker.js` (caché y recursos)
- `tests/v19316-smart-scouting.test.cjs` (nuevo)
- `tests/smoke_v19316_playwright.py` (nuevo)
- `README.md` y este documento de release.
