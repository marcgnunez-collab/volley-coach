# Volley Coach V20.5.27 · Filtros multidimensionales y memoria de análisis

## Qué ha cambiado

Se amplía el índice local de V20.5.26 (`src/state/analysis-index.ts`) para que **Análisis → Data Engine** pueda consultar contactos por equipo, fundamento, valoración, jugador, zona de origen, zona de destino y presencia de vídeo. El motor escoge la lista de candidatos más pequeña y después sigue aplicando **todas las condiciones originales**. Así se mantiene exactamente la semántica de las posesiones, las cadenas de colocación, los rallies seleccionados y su orden.

Los índices siguen asociados mediante `WeakMap` a **una proyección normalizada del scouting**, nunca a un partido persistido. Cuando el usuario corrige o deshace acciones, la siguiente normalización construye una proyección nueva, sin arrastrar resultados anteriores. Si un desarrollador modifica directamente una proyección ya calculada, debe llamar a `invalidateAnalysisIndex(projection)` antes de volver a consultar.

Para proteger el navegador:

- Solo se indexan proyecciones con **hasta 40.000 contactos**. Los partidos mayores **no se bloquean**: usan el filtrado ordinario.
- Los rallies con identificadores duplicados o contactos desordenados siguen usando el recorrido original para preservar los resultados y el orden.
- Las consultas generales pueden seguir ejecutándose sin índices para evitar crear listas innecesarias.
- Los contadores no almacenan nombres, códigos ni identificadores. **No se añade un escritor**.

## Dónde comprobar las mejoras

1. En un partido registrado, entra en **Análisis → Data Engine**.
2. Filtra por equipo, jugador, fundamento, valoración y zona. Comprueba que los rallies y contactos coinciden con el scouting original.
3. Abre **Gestión → Rendimiento**, busca **«Exportación CSV e índices temporales»** y pulsa **Actualizar medición**.
4. Observa los nuevos indicadores: filtros multidimensionales, contactos cuyo recorrido se ha evitado, referencias aproximadas del índice y consultas que han superado el límite de indexación.

También se muestra **Heap JS navegador** cuando el navegador soporta ese dato. Si no lo soporta, aparece «No disponible». El heap corresponde **a toda la página**, no exclusivamente al Data Engine. La estimación de referencias del índice **no mide su consumo real de memoria**: no incluye objetos, cadenas, mapas ni sobrecostes del motor JavaScript. Se mantiene en Gestión el diagnóstico histórico de los scripts de carga más lentos.

## Instalación sobre V20.5.26

Antes de actualizar, guarda una copia protegida JSON en **Gestión → Recuperación**.

1. Descarga el ZIP `Volley_Coach_V20.5.27_SOLO_CAMBIOS.zip`.
2. Descomprímelo y carga **todos sus archivos** en [GitHub · volley-coach](https://github.com/marcgnunez-collab/volley-coach), respetando las rutas y sustituyendo homónimos.
3. Revisa que GitHub Actions termine correctamente y que se publique la actualización.
4. Recarga la web sin caché (`Ctrl + F5`). Comprueba filtros y exportación CSV sobre un partido conocido. Prueba a corregir y deshacer una acción no importante y comprueba que las cifras se actualicen.

**No borres** `189-vc1938-professional-data-engine.js`, `190-vc1939-rally-search-pro.js` ni los escritores `233`/`234`. Los scripts antiguos siguen siendo respaldo; el motor de puntos, deshacer, vídeo, IndexedDB, diario CAS y Supabase **no se han modificado**.

El ZIP **COMPLETO** permite una instalación nueva. El ZIP **PUBLICACION_VITE** contiene la compilación para producción, no sustituye los fuentes de GitHub.

## Verificación técnica

- `npm ci && npm run test:foundation`: compilación Vite, TypeScript y pruebas de regresión.
- `node --test vc20527-multidimensional-index-memory.test.cjs`: compara filtros cruzados y orden contra V19.3.8, simula edición y deshacer, verifica el límite de 40.000 contactos y el diagnóstico de memoria sin datos personales.
- `npm run benchmark:analysis`: utiliza solo datos sintéticos (3.000 rallies/18.000 acciones) y compara las mismas búsquedas con y sin índices. Se mide una mediana de cinco ejecuciones; cambia según hardware y GC.

La prueba local **no garantiza tiempos reales de partido**. Queda pendiente la medición dentro de Chromium publicado, con vídeo, una temporada larga y dos dispositivos físicos conectados.

## Siguiente paso

Revisar el coste de renderizado real en Análisis y Scouting, detectar los paneles que se actualizan de más y comenzar a consolidar la interfaz sin retirar aún los adaptadores históricos de escritura.
