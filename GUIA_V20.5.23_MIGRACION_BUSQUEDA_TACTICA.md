# Volley Coach V20.5.23 · Migración real del buscador táctico

## Novedad principal

El motor que calcula las búsquedas de rallies con filtros cruzados en **Análisis → Búsqueda táctica** se ha extraído del módulo clásico V19.3.9 a `src/state/analysis-query.ts` (TypeScript) y ahora se incluye en el bundle Vite. La interfaz del buscador clásico no cambia: conserva los filtros, la selección de rallies, la navegación al vídeo, la exportación CSV y las búsquedas guardadas.

El puente de compatibilidad `src/state/analysis-query-runtime.ts` publica `window.VC_ANALYSIS_QUERY_20523`. El archivo `190-vc1939-rally-search-pro.js` delega la consulta al motor tipado cuando está disponible y conserva su función histórica de consulta como **alternativa segura**, por si falla el módulo moderno. La búsqueda devuelve referencias a los rallies reales: no inventa acciones, jugadores ni resultados.

Esta etapa **no elimina todavía el script 190 de la carga**: migra el cálculo que utiliza la interfaz, con salida de emergencia. Es una migración funcional progresiva, no la transformación completa de la aplicación en una SPA.

## Nueva medición en Gestión

Pulsa **Gestión → Rendimiento**. Dentro del panel de rendimiento, debajo de las métricas iniciales, verás **«V20.5.23 · Rendimiento de búsquedas tácticas»**. Incluye:

| Indicador | Significado |
|---|---|
| Consultas | Total de búsquedas ejecutadas por el motor nuevo en este navegador. |
| Última | Duración de la última búsqueda. |
| Media | Tiempo medio de las consultas realizadas. |
| Máxima | Consulta más lenta observada. |
| Más de 16 ms | Conteo de consultas que superaron un umbral orientativo de 16 ms. |
| Errores | Consultas que lanzaron un error. La interfaz puede usar el cálculo anterior. |

Pulsa **Actualizar medición** después de hacer varias búsquedas. No hay sondeos automáticos ni nuevos listeners de partido. Solo se registran contadores y tiempos locales; no se conservan nombres, códigos, IDs ni resultados de búsqueda en este diagnóstico. **La medición no incluye** renderizado del DOM, vídeo, descargas ni sincronización, y todavía no prueba latencias reales de uso continuo.

## Instalación desde GitHub

1. Ten instalada **V20.5.22**. Antes de cualquier actualización, guarda una copia JSON protegida desde Gestión → Recuperación.
2. Descarga `Volley_Coach_V20.5.23_SOLO_CAMBIOS.zip`, descomprímelo y sube **todos sus archivos y carpetas** a la raíz de [volley-coach](https://github.com/marcgnunez-collab/volley-coach), sobrescribiendo los que coincidan.
3. Confirma los cambios en GitHub y verifica la ejecución de GitHub Actions. No borres `189-vc1938-professional-data-engine.js`, `190-vc1939-rally-search-pro.js`, `211-vc2012-multi-device-validation.js` ni los escritores del motor V13.
4. Si publicas con Vite, utiliza el proceso de publicación habitual; el ZIP `PUBLICACION_VITE` contiene exclusivamente la distribución compilada y no debe usarse para sustituir el código fuente.
5. Actualiza la web sin caché (Ctrl+F5). En Análisis → Búsqueda táctica, prueba filtros de rival, P1–P6, recepción, colocador y atacante. Abre un rally desde el resultado y comprueba que salta al vídeo correcto.
6. Visita Gestión → Rendimiento para verificar que el contador de consultas crece. Corrige un rally de prueba y repite la búsqueda: los resultados deben corresponder al scouting corregido.

## Tests ejecutables

En un entorno con Node.js: `npm ci` y `npm run test:foundation`. El test `vc20523-analysis-query-migration.test.cjs` compara exhaustivamente la consulta nueva con la original, incluidas combinaciones con equipo, estado del rally, set, rotaciones, fase K1/K2, códigos, posiciones, vídeo y secuencias recepción→colocación→ataque. También valida las rutas de fallback y el panel de Gestión sin suscripciones nativas añadidas.

Las pruebas automatizadas no sustituyen las comprobaciones visuales en el navegador publicado ni los ensayos de sincronización PC+móvil.

## Próxima migración

Conservar el motor de registro de puntos hasta disponer de una batería completa de reglas, deshacer, temporadas extensas y pruebas de recuperación. Continuar por el normalizador del Data Engine de Análisis y otras vistas de solo lectura, retirando scripts clásicos únicamente cuando quede demostrada la equivalencia del reemplazo.
