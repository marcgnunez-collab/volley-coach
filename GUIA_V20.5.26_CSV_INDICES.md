# Volley Coach V20.5.26 · CSV profesional e índices del Data Engine

## Cambios realizados

La exportación de contactos de **Análisis → Data Engine → Exportar selección CSV** se ejecuta ahora en TypeScript/Vite (`src/state/analysis-export.ts`). El puente de compatibilidad (`src/state/analysis-export-runtime.ts`) se instala antes del uso de la interfaz y publica `window.VC_ANALYSIS_CSV_20526`. El script clásico `189-vc1938-professional-data-engine.js` mantiene intacta la función original para recuperar automáticamente el CSV si el nuevo módulo falla.

El contenido del CSV es **idéntico al de V19.3.8**:

- 18 columnas de contactos en el mismo orden, con referencias originales de set, rally, acción y posesión.
- UTF-8 con BOM, separador `;`, campos entre comillas y saltos de línea `CRLF`.
- Protección existente frente a fórmulas de hojas de cálculo; valores numéricos negativos se respetan.
- Mismo nombre de archivo descargado y selección activa del usuario; no se toca el vídeo.

Se añade `src/state/analysis-index.ts`: índices temporales de **contactos, posesiones y cadenas por rally**, además de contactos por posesión. Los filtros selectivos reutilizan estos índices dentro de **una única proyección normalizada**. La cache usa `WeakMap` y no almacena información en disco ni comunica nada con la nube. Cada normalización tras corregir o deshacer un rally produce una proyección nueva, por tanto no reutiliza el índice del estado anterior.

Los índices únicamente intervienen cuando hay suficientes rallies y el filtro reduce la muestra al 50 % o menos. Los filtros generales, los rallies con IDs duplicados y las listas de contactos desordenadas utilizan la ruta clásica de recorrido para mantener exactamente el orden y los resultados. Ante una modificación estructural *directa* de la propia proyección, las integraciones deben llamar a `invalidateAnalysisIndex(projection)`; las correcciones habituales al partido original se gestionan creando una nueva proyección, sin requerir invalidación manual.

**No cambia** el registro nativo de puntos, deshacer, alineaciones, vídeo, IndexedDB, diario de recuperación, Supabase ni el protocolo CAS. No se añade ningún segundo escritor.

## Dónde se comprueba

En **Gestión → Rendimiento → Rendimiento del Data Engine y búsquedas**, abre la cuarta sección **«Exportación CSV e índices temporales»**. Muestra contadores de:

1. CSV generados, última duración, media y errores.
2. Índices creados, reutilizados, invalidados y modelos no indexables.

Abre **Análisis → Data Engine**, filtra por equipo/set/rotación, exporta CSV y vuelve a Gestión → Rendimiento. Pulsa **Actualizar medición**. La sección muestra números de esta sesión, sin nombres, códigos de jugadas ni identificadores de partido.

## Instalación en GitHub

El ZIP **SOLO_CAMBIOS** debe aplicarse sobre **V20.5.25**. Antes de actualizar, guarda una copia JSON protegida del equipo desde Gestión → Recuperación.

1. Descarga `Volley_Coach_V20.5.26_SOLO_CAMBIOS.zip` y descomprímelo.
2. En [GitHub · volley-coach](https://github.com/marcgnunez-collab/volley-coach), sube **todos los archivos** del ZIP, respetando carpetas y reemplazando homónimos.
3. Espera a que **GitHub Actions** termine correctamente y se actualice la publicación.
4. Fuerza la recarga de la página (`Ctrl + F5`) y comprueba que la exportación conserva el orden y el contenido esperado.
5. Verifica en un scouting conocido que una corrección o deshacer cambia los filtros y el CSV. Comprueba también los saltos al vídeo y la nube, sin modificar partidos importantes para la prueba.

No elimines los scripts `189`/`190` ni los escritores `233`/`234`: siguen siendo compatibles y los dos últimos gestionan el estado real. **COMPLETO** es para instalación nueva; **PUBLICACION_VITE** contiene la compilación de producción, no sustituye al código fuente de GitHub.

## Pruebas y rendimiento

- `npm ci && npm run test:foundation`: TypeScript, Vite y pruebas de regresión.
- `node --test vc20526-analysis-export-index.test.cjs`: equivalencia exacta de CSV, filtros indexados, duplicados, datos fuera de orden, corrección, deshacer, fallback y ausencia de escritor paralelo.
- `npm run benchmark:analysis`: 3.000 rallies y 18.000 contactos sintéticos, comparando normalización, filtros, índices y CSV del motor anterior y TypeScript.

Las mediciones **no representan garantías** de respuesta en directo ni sustituyen las pruebas de navegador publicado con un partido completo y dos dispositivos reales. El CSV incorpora operaciones solo bajo demanda, no exportaciones automáticas en segundo plano.

## Próximos objetivos

Medir el uso real de memoria/latencia por módulo, mejorar los índices de filtrado multidimensional sin alterar semántica y simplificar los archivos clásicos cuando las pruebas de compatibilidad y recuperación permitan retirar sus respaldos con seguridad.
