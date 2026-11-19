# Volley Coach V20.5.24 · Normalizador de Análisis en TypeScript/Vite

## Qué se ha migrado

El núcleo que convierte los registros de scouting en la información utilizada por los análisis tácticos ya vive en `src/state/analysis-normalizer.ts`:

- Rally con referencia estable al partido, set e índice original.
- Contactos con dorsal/jugador, fundamento, valoración, zonas y marcas de vídeo disponibles.
- Posesiones separadas por equipo; un contacto sin equipo rompe la secuencia.
- Enlaces explícitos entre recepción, colocación y ataque; sin asociar contactos de posesiones ajenas.
- Incidencias de cobertura y calidad: sets/rallies/acciones duplicados, zonas inválidas, valoraciones desconocidas y resultados ausentes.

`src/state/analysis-normalize-runtime.ts` expone `window.VC_ANALYSIS_NORMALIZE_20524`. El Data Engine de V19.3.8 (`189-vc1938-professional-data-engine.js`) mantiene la interfaz, las tablas y la lógica de respaldo, pero **delega la normalización** al módulo TypeScript cuando está disponible. Si el módulo no funciona, se ejecuta el cálculo histórico original. La función `normalize` no guarda ni modifica el partido.

El normalizador tiene un contrato tipado común con el buscador migrado en V20.5.23. Ambas piezas trabajan ahora en la misma compilación Vite, sin segundo escritor, sin llamadas a Supabase y sin copias persistentes del estado.

## Dónde comprobarlo

En **Gestión → Rendimiento**, dentro del panel de diagnósticos, aparece **«Rendimiento de normalización y búsquedas»**, dividido en:

1. Búsqueda táctica: número de consultas, última duración, media, máxima, consultas superiores a 16 ms y errores.
2. Normalización del Data Engine: número de normalizaciones, última duración, media, máxima, normalizaciones superiores a 16 ms y errores.

Haz búsquedas en Análisis y después pulsa **Actualizar medición**. Solo se guardan contadores numéricos durante esta sesión del navegador; el diagnóstico no retiene jugadores, códigos ni IDs. Los tiempos son de cálculo, no de dibujar las tablas, mover el vídeo o enviar datos a la nube. El umbral de 16 ms es orientativo; no garantiza fluidez profesional en un partido completo.

## Instalación en GitHub

Base obligatoria: **V20.5.23**. Antes de actualizar, conserva una copia protegida JSON del equipo desde Gestión → Recuperación.

1. Descarga `Volley_Coach_V20.5.24_SOLO_CAMBIOS.zip` y descomprímelo.
2. En [tu repositorio volley-coach](https://github.com/marcgnunez-collab/volley-coach), sube **todos los archivos** respetando sus rutas y sobrescribe los homónimos.
3. Confirma la subida y comprueba que GitHub Actions termina correctamente.
4. No elimines los scripts antiguos, incluidos `189-vc1938-professional-data-engine.js`, `190-vc1939-rally-search-pro.js` ni los escritores `233` y `234`: los dos primeros son adaptadores y respaldo; los dos últimos siguen siendo el motor original.
5. Tras publicar, recarga sin caché (Ctrl+F5). En Análisis, verifica posesiones, colocadores, secuencias, filtros por zonas y salto al vídeo. Compara con un scouting ya conocido. Corrige un rally de prueba y asegúrate de que la nueva lectura refleja la corrección.

El ZIP **COMPLETO** contiene todo el proyecto para una instalación nueva. El ZIP **PUBLICACION_VITE** es la salida compilada; no sustituye los fuentes de GitHub.

## Pruebas

`npm ci`, luego `npm run test:foundation`. La prueba `vc20524-analysis-normalizer-migration.test.cjs` compara el normalizador nuevo con el real V19.3.8 en conjuntos con errores, cambios y deshacer, verifica que las consultas tácticas producen los mismos resultados y valida el fallback.

También puedes ejecutar **`npm run benchmark:analysis`** para medir el motor antiguo y el nuevo con un partido **sintético de 3.000 rallies** (seis contactos por rally). El script comprueba primero que los resultados sean idénticos y después muestra la mediana de cinco ejecuciones de cada motor. No utiliza datos del club y no debe interpretarse como una garantía de latencia del navegador.

Todavía falta la comprobación visual en el navegador publicado y la prueba de sincronización entre dos dispositivos reales; los tests no demuestran por sí solos una latencia profesional en directo.

## Siguiente fase

Migrar gradualmente otras funciones puras del Data Engine (`filter`, cobertura y evaluación) y después medir el comportamiento con temporadas largas. El registro de puntos, el deshacer y la sincronización CAS seguirán en el motor original hasta disponer de pruebas completas de recuperación, rollback y conflictos multi-dispositivo.
