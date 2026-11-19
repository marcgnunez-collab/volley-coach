# Volley Coach V20.5.40 · Dirección, bloqueo y dorsal propio

**Versión base: V20.5.39.** Esta actualización continúa la reducción de envoltorios históricos del parser de Scouting.

## Arquitectura modificada

### 1. Un único envoltorio para dirección y bloqueo

Las antiguas capas V8.3 (dirección de ataque y recepción) y V8.4 (bloqueo) pasan a una función de parser compartida. Se mantiene exactamente la secuencia histórica:

1. Leer objetivos de bloqueo y corregir la zona individual de bloqueo, si aparece.
2. Extraer dirección de ataque (LIN/DC/DL).
3. Invocar **una sola vez** al parser base.
4. Aplicar los metadatos de recepción y la dirección de ataque; normalizar y reconstruir el código.
5. Aplicar objetivos y número de bloqueadores; normalizar y reconstruir el código de nuevo.

El archivo `021-core-scouting-v150-monolithic.js` pasa a tener un envoltorio menos de `scoutV6108ParseRaw`.

### 2. Selección del jugador propio con TypeScript

Los módulos `src/domain/scout-player-resolution.ts` y `src/domain/scout-player-resolution-runtime.ts` reciben un resultado ya obtenido por el **único buscador nativo de plantilla** y, si procede, la acción anterior del editor.

- Si existe jugador en la plantilla, se conserva **la misma referencia**.
- Si no existe, solo se reutilizan los campos históricos cuando coincide literalmente el dorsal guardado.
- Si la decisión TypeScript difiere o falla, se usa automáticamente la decisión clásica.
- Los diagnósticos muestran solo contadores; no guardan dorsales, nombres ni datos del vídeo.

La búsqueda del rival sigue siendo nativa. La escritura de rallies no se ha trasladado ni duplicado.

## Dónde verlo

En **Scouting → Scoutar → Scouting Speed Pro**, el indicador de preparación mostrará:

**«Preparación y dorsal TypeScript · escritura nativa»**

Si el módulo no está disponible, se conserva la preparación y la elección de jugador clásicas.

## Pruebas

Se mantiene el fixture independiente de la V20.5.39 con los dos envoltorios originales en `test-audit/fixtures/v20539-direction-block-wrappers.txt`.

La validación cubre comparación de acciones y errores, edición con `oldAction`, identidad del jugador, distinción exacta entre dorsales `8` y `08`, número de consultas a plantilla y fallback cuando TypeScript falla.

**Pendiente:** estas pruebas no sustituyen validar un partido real con vídeo ni sincronización simultánea entre ordenador y móvil.

## Actualizar GitHub

| Paquete | Uso |
| --- | --- |
| `Volley_Coach_V20.5.40_SOLO_CAMBIOS.zip` | Si ya tienes V20.5.39. Descomprimir y colocar su contenido en la raíz del repositorio, manteniendo las carpetas. |
| `Volley_Coach_V20.5.40_COMPLETO.zip` | Proyecto íntegro. |
| `Volley_Coach_V20.5.40_PUBLICACION_VITE.zip` | Distribución de producción generada por Vite. |

No subas el ZIP como archivo de la web. Publícalo descomprimido, fuerza la recarga del navegador y comprueba **Gestión → Comprobación del sistema**.

Antes de un partido oficial, utiliza un partido de prueba para revisar ataque con dirección, bloqueo con zona única, corrección de dorsal en el editor, deshacer, estadísticas, vídeo y sincronización.
