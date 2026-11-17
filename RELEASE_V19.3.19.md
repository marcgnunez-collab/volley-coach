# Volley Coach · V19.3.19 · Bench Client Pro

**Base:** ZIP completo V19.3.18. Versiones y módulos de análisis, vídeo, scouting, REC, Delay y nube conservados.

## Implementación

- `201-vc19319-bench-client-pro.js`: motor de consulta (sin escrituras), datos de partido, K1/K2, eficacia, rotaciones, últimos rallies, detalle de contactos, controles, enlace consulta y diagnóstico de frescura.
- `vc19319-bench-client-pro.css`: diseño adaptable para escritorio, tableta y móvil; panel independiente dentro del Banquillo Pro.
- `index.html`: carga con identificadores y query strings de V19.3.19, registro del nuevo módulo.
- `service-worker.js`: nueva revisión de caché e inclusión de los recursos. Las respuestas privadas de Supabase siguen fuera del service worker.
- `tests/v19319-bench-client.test.cjs`: pruebas unitarias de cálculos, datos no inventados, filtros, escape y ruta de consulta.
- `tests/smoke_v19319_bench.py`: flujo aislado de Chromium de escritorio y móvil.

## Validación

- `node --test tests/*.test.cjs`: 61 pruebas aprobadas, incluidas ocho para Bench Client Pro.
- `python tests/smoke_v19319_bench.py`: prueba aislada de escritorio y móvil superada, con filtros, selección de rally, detalle, actualización local y retorno a la vista clásica.
- Comprobación sintáctica de módulos JS y scripts internos del HTML.

## Límites

- No se ha comprobado con una sesión real de Supabase, un partido completo y dos dispositivos: **esta validación sigue pendiente**.
- El enlace de consulta no concede permisos y exige acceso autorizado al mismo equipo. Modo consulta restringe la interfaz, pero no introduce políticas de autorización nuevas.
- Las grabaciones de vídeo no se sincronizan automáticamente entre dispositivos.
- El ZIP original de V19.3.18 ya incluía 11 referencias a CSS históricos ausentes; no se generan archivos vacíos ni se eliminan estilos auténticos del repositorio.
