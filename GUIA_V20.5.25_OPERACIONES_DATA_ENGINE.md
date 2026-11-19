# Volley Coach V20.5.25 · Filtros y métricas del Data Engine en TypeScript

## Qué cambia

Continúa la migración real de Análisis a Vite y TypeScript iniciada en V20.5.23–24. Cinco funciones de lectura que estaban únicamente en `189-vc1938-professional-data-engine.js` pasan a `src/state/analysis-operations.ts`:

1. **Filtros de scouting**: equipo, set, rotación, K1/K2, fundamento, valoración, jugador, zonas, colocador, vídeo y posesiones coincidentes.
2. **Evaluación**: intentos, contactos evaluados, puntos, errores, bloqueos y eficiencia por fundamento.
3. **Oportunidades de punto**: K1 (Side-Out), K2 (Break Point) y rallies con saque desconocido.
4. **Cobertura de datos**: valoración, jugador, equipo, zona, vídeo, tempo, destino y calidad de referencias.
5. **Conciliación K1/K2**: verifica que los denominadores coincidan con el informe previo; no los reemplaza.

El puente `src/state/analysis-operations-runtime.ts` publica `window.VC_ANALYSIS_OPERATIONS_20525`. El módulo histórico conserva su API y las cinco funciones anteriores como respaldo, pero **tanto sus métodos públicos como el panel real del Data Engine** llaman ahora al TypeScript cuando está disponible. Si falla un cálculo o no está disponible el bundle, se utiliza el algoritmo anterior.

Los contactos, rallies y jugadores siguen viniendo de un único scouting canónico. Los filtros conservan las referencias originales, sin duplicar el estado. Esta versión **no modifica** registro de códigos, puntuación, deshacer, vídeo, IndexedDB, sincronización CAS o Supabase; no incorpora escritores ni escucha nuevos eventos del partido.

## Dónde verlo

Abre **Gestión → Rendimiento**. En **«Rendimiento del Data Engine y búsquedas»** encontrarás una tercera sección, **«Filtros, métricas, K1/K2 y cobertura»**, con contadores de cada operación, duración media, cálculos superiores a 16 ms y errores. Las mediciones guardan solo números en memoria durante la sesión.

Para comprobarlo, abre un partido registrado, ve a **Análisis → Data Engine**, cambia filtros de equipo, fundamento o valoración y vuelve a Gestión → Rendimiento. Pulsa **Actualizar medición**. Deben aumentar los contadores de filtros, evaluaciones y cobertura. Los saltos al vídeo y el resto de los análisis deben funcionar como antes.

## Cómo instalarlo en GitHub

**Base de SOLO_CAMBIOS: Volley Coach V20.5.24.** Antes, conserva una copia protegida JSON desde **Gestión → Recuperación**.

1. Descarga `Volley_Coach_V20.5.25_SOLO_CAMBIOS.zip` y descomprímelo.
2. Abre [GitHub · volley-coach](https://github.com/marcgnunez-collab/volley-coach) y carga **todos** los archivos descomprimidos, manteniendo carpetas y reemplazando homónimos.
3. Revisa que **GitHub Actions** termine correctamente. Si la web está en GitHub Pages, espera a la publicación y haz una recarga forzada.
4. **No borres** `189-vc1938-professional-data-engine.js`, `190-vc1939-rally-search-pro.js` ni los escritores `233` y `234`: mantienen compatibilidad y persistencia.
5. En un partido conocido, comprueba filtros K1/K2, cobertura, secuencias recepción→colocación→ataque y una corrección post-rally. El análisis debe reflejar los datos corregidos.

El ZIP **COMPLETO** sirve para instalaciones desde cero; **PUBLICACION_VITE** es la compilación de producción, no un reemplazo de las fuentes de GitHub.

## Verificaciones y límites

`npm ci && npm run test:foundation` compila TypeScript/Vite y compara los cinco cálculos con las funciones históricas en más de mil combinaciones de filtros, datos incompletos, contactos desconocidos, posesiones y rutas de respaldo. Se comprueba también que el panel HTML real utiliza el puente nuevo.

`npm run benchmark:analysis` mide la normalización y el paquete de cinco operaciones con **datos sintéticos** y contrasta antes la igualdad de resultados. La mediana de cinco ejecuciones depende de la máquina: **no garantiza** menos de 16 ms en un navegador real.

Siguen pendientes la validación visual tras desplegar y las pruebas de partido y vídeo con dos dispositivos físicos antes de migrar el motor de escritura.

## Siguiente etapa

Migrar la exportación CSV del Data Engine y reducir trabajo repetido mediante índices derivados por rally/posesión, con pruebas de invalidación después de correcciones. El registro de puntos, deshacer y CAS permanecen en el motor nativo hasta superar pruebas completas de recuperación y rollback multi-dispositivo.
