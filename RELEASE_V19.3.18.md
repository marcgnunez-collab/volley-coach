# Release V19.3.18 · Worksheets & Reports Pro

## Base

V19.3.17 COMPLETO, conservando V19.3.14–17. No migraciones de scouting ni cambios en motores REC, Delay, Supabase, marcador o vídeo.

## Archivos principales

- `200-vc19318-worksheets-reports-pro.js` — vistas, filtros, cálculos, plantillas e informes, de solo lectura.
- `vc19318-worksheets-reports-pro.css` — diseño profesional responsive y navegación con 7 módulos.
- `191-vc19310-professional-analysis-architecture.js` — enrutamiento de Worksheets, eventos y navegación al vídeo.
- `index.html` — carga de JS y CSS con versión 19.3.18.
- `service-worker.js` — nuevo nombre de caché, incorporación de nuevos recursos.
- `tests/v19318-worksheets-reports.test.cjs` — pruebas unitarias y regresión del módulo.
- `tests/smoke_v19318_worksheets.py` — prueba aislada de interfaz Chromium.
- `GUIA_WORKSHEETS_REPORTS_V19.3.18.md` — instrucciones y criterios de cómputo.

## Validación

- `node --test tests/*.test.cjs`: 53 pruebas aprobadas (42 preexistentes + 11 nuevas para V19.3.18, incluida compatibilidad de plantillas antiguas).
- `python tests/smoke_v19318_worksheets.py`: flujo UI aprobado en Chromium (filtros, columnas, CSV/HTML, grupo y navegación a Video Analysis).
- Sintaxis JS, HTML y service-worker: ver auditoría ejecutada para el ZIP.

## Limitaciones heredadas

- El ZIP original incluía referencias a hojas CSS que no están en el propio archivo. Las nuevas hojas CSS para V19.3.18 sí se adjuntan.
- La proyección `VC_DATA_ENGINE_1938.filter` utilizada por Análisis excluye rallies sin cerrar; el dato de la muestra se actualiza cuando se registran y cierran.
- Los presets solo se almacenan en el navegador donde se guardan y el informe se exporta como HTML/CSV o PDF mediante la función de imprimir del navegador.
- No se ha verificado el funcionamiento completo en producción con dos dispositivos y Supabase; tampoco la equivalencia total con las hojas Data Volley 4.
