# V19.3.16.3 · Distribution Intelligence Layout & Tables

**Base real:** `Volley_Coach_V19.3.16.1_COMPLETO.zip`, NO `Volley_Coach_V19.3.16.2_DISTRIBUTION_FIX_COMPLETO.zip` (base errónea V19.3.14).

## Funciones nuevas / corregidas

- Vista Consecutiva con matriz P1–P6, resumen estadístico por rotación y registro tabular detallado de colocaciones, ataques, llamadas, recepción, tempo, marcador verificado y rally de origen.
- Vista Llamadas K con matrices llamadas × zona y llamadas × atacante, frecuencias y eficiencias sobre datos explícitos.
- Pista compacta de seis zonas y porcentajes con denominador real, **sin el SVG de flechas sobredimensionado**.
- Filtros esenciales en una fila compacta y criterios adicionales en desplegable; las dos vistas siguen siendo independientes.
- Botón Vídeo en cada fila y en la lista de rallies, enrutado a Video Analysis manteniendo la selección original; no garantiza grabación si no existe.
- CSS específico reforzado y estilo de emergencia en `index.html` para un despliegue parcial; nuevas versiones de recursos y caché del service worker.
- Se preservan archivos y motores de V19.3.15 (Scouting Editor), V19.3.16 (Smart Scouting), V19.3.16.1 (Distribution Intelligence), sync y Delay.

## Archivos alterados

- `198-vc193161-distribution-intelligence.js`
- `vc193161-distribution-intelligence.css`
- `191-vc19310-professional-analysis-architecture.js`
- `index.html`
- `service-worker.js`
- `tests/v193163-distribution-pro.test.cjs` (nuevo)
- `tests/smoke_v193163_bridge.py` (nuevo)
- `GUIA_DISTRIBUTION_INTELLIGENCE_V19.3.16.3.md` (nuevo)
- `RELEASE_V19.3.16.3.md` (nuevo)
- `README.md`

## Validación

- Tests existentes V19.3.15, V19.3.16 y V19.3.16.1 conservados.
- Nuevos tests con tablas, referencia rally, control de rotaciones desconocidas y separación de llamadas.
- Prueba aislada en Chromium con filtros, tablas y controles.
- Prueba de navegación completa del *router* Analysis → Video Analysis en simulación aislada.

## Límites

No se ha validado la aplicación publicada, Supabase ni el vídeo de un partido real. El análisis reproduce parte del flujo de trabajo de Data Volley 4, pero **no implica equivalencia exacta de algoritmos ni de movimientos del central**. Las 11 referencias históricas a CSS ausentes de la base siguen documentadas: no se generan archivos vacíos en su lugar.
