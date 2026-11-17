# Volley Coach V19.3.16.1 · Distribution Intelligence Pro

**Base:** `Volley_Coach_V19.3.16_COMPLETO.zip` de esta conversación. No se ha modificado el formato original de scoutings ni el esquema Supabase. La implementación analiza los datos canónicos de V19.3.8 y se integra en Análisis → Distribution mediante V19.3.10. No se toca el guardado original, REC, marcador, sincronización, históricos de Delay ni reproductor.

## Mejoras entregadas

- **Consecutive Distribution:** matriz de las seis rotaciones P1–P6, contactos E → A verificables y cronológicos, valoración A, recepción anterior R y marca original `scoutMs` (si constan), tanteo solo si está registrado, selección de rallies y apertura de Video Analysis.
- **Setter Call Distribution:** llamadas K registradas en acción E, tablas de volúmenes, porcentaje y eficiencia, pista conjunta, pistas individuales, selección por llamada, giro del esquema y opciones F/C/B/P/S expresamente codificadas.
- **Filtros:** colocador, rotación, fase identificada por contactos, recepción, atacante, tempo E, combinación, llamada K, tipo explícito F/C/B/P/S, origen A / destino E, equipo/set/fase/rotación globales heredados.
- **Integridad:** no inferir recepción, ataque, marcadores, coordenadas o llamada del central. Las parejas de contactos se buscan en una misma posesión, sin atravesar acciones previas A/E ni una nueva recepción entre E y A. Denominadores de tabla y pista explicados por separado.
- **Exportación CSV** del subconjunto filtrado, codificación segura para abrir como hoja de cálculo, controles de selección original.
- **Guía detallada** `GUIA_DISTRIBUTION_INTELLIGENCE_V19.3.16.1.md`, con explicación de Data Volley documentada y uso concreto en Volley Coach.

## Limitaciones explícitas

- No puede ser una reproducción 1:1 de Data Volley 4: no se dispone de todas las reglas internas propietarias, del catálogo gráfico de recorridos del central ni de equivalencia exhaustiva de fórmulas; el diseño es propio de Volley Coach. Cuando no hay recorridos, no se dibujan como si existieran.
- Sin exportación de *imagen* en esta fase; hay exportación CSV de secuencias. Sin análisis multi-partido para esta pantalla.
- No ejecutada prueba de la app completa ni de partido real con PC/móvil/Supabase; el entorno de validación visual es una instancia aislada de Chromium.
- Heredadas del ZIP base: 11 referencias CSS a archivos que no estaban presentes. No crear CSS vacíos ni borrar versiones del repositorio que pudieran contenerlos.

## Instalación en GitHub Pages

1. Exporta una copia JSON de tus scoutings desde cada dispositivo y conserva los dos archivos.
2. Si ya usas V19.3.16, sube **solo los archivos del ZIP `SOLO_CAMBIOS`**, con la ruta de carpeta correspondiente. No borres otros recursos.
3. Espera a que finalice GitHub Pages, recarga la web en ambos dispositivos y confirma que carga el script V19.3.16.1.
4. En Análisis, selecciona un scouting y entra en Distribution. Cambia entre las dos vistas, prueba los filtros, revisa secuencias que conozcas, abre los rallies originales y exporta CSV.
5. Verifica la recuperación del mismo partido y el estado de sincronización en PC y móvil. **No se presume validación en nube por ver un indicador de conexión.**

## Archivos modificados o nuevos

- `198-vc193161-distribution-intelligence.js` — módulo nuevo read-only.
- `vc193161-distribution-intelligence.css` — estilos nuevos de la pantalla.
- `191-vc19310-professional-analysis-architecture.js` — enrutamiento de la vista y eventos.
- `index.html` — carga de script/estilos.
- `service-worker.js` — caché nueva y recursos adicionales.
- `tests/v193161-distribution.test.cjs` — pruebas unitarias nuevas.
- `tests/smoke_v193161_playwright.py` — prueba visual aislada.
- `GUIA_DISTRIBUTION_INTELLIGENCE_V19.3.16.1.md` — guía nueva.
- `RELEASE_V19.3.16.1.md` — notas de versión.
- `README.md` — referencias.

## Plan de verificación

- **31 pruebas Node aprobadas** sobre V19.3.15 + V19.3.16 + V19.3.16.1.
- **130 archivos JS y 79 scripts HTML sin errores sintácticos**.
- **Chromium aislado superado:** rotaciones, filtros, llamadas, F/C/B/P/S, exportación, guía, enlace de vídeo y protección DOM.
- Pruebas reales adicionales pendientes: sync, vídeo real, 5 sets, diferentes equipos y editor en simultáneo.
