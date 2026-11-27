# Volley Coach V20.6.2 — Historial único de rallies de solo lectura

## Bloque 3 de la migración arquitectónica

Esta versión continúa directamente sobre V20.6.1. Cinco puntos de la aplicación que recorrían por su cuenta los sets y rallies utilizan ahora un **módulo TypeScript común**:

| Superficie efectiva | Recorrido compartido | Respaldo conservado |
| --- | --- | --- |
| Scouting → Analizar | Lista de rallies por orden de set y rally | `scoutAllRallies()` nativo |
| Match Mode | Referencias a cada set y rally | `allRallies()` nativo |
| Rally Review Pro | Filas con índice, ganador, acciones y marcador histórico real | `collect()` nativo |
| Match Workspace | Últimos cinco rallies y sus etiquetas | `summarizeMatch()` nativo |
| Vídeo LIVE V7.40 | Último rally cerrado, conservando la referencia de su set | `lastClosedRally()` nativo |

El nuevo código se encuentra en `src/state/shared-rally-timeline.ts` y el adaptador en `src/state/shared-rally-timeline-runtime.ts`. La interfaz global es `window.VC_RALLY_TIMELINE_2062` (`VERSION: 20.6.2`, `readOnly: true`). Se publica mediante el mismo módulo Vite que V20.6.1; **no se crea otro motor ni otra base de datos**.

### Protección de compatibilidad

- Antes de utilizar cada proyección TypeScript, el consumidor comprueba los objetos originales (identidad de set/rally y campos de fila) o compara las cinco entradas visibles.
- Si el adaptador no existe, lanza error, devuelve elementos diferentes o no puede confirmar la equivalencia, utiliza el recorrido histórico sin intentos de escritura nuevos.
- Los rallies, acciones, metadatos de vídeo, resultados y marcadores siguen siendo referencias del partido canónico; no hay clonado, reconstrucción de tanteos históricos ni inventario de tiempos inexistentes.
- `lastClosedRallyRef` busca hacia atrás sin aplanar íntegramente todos los rallies cuando necesita únicamente el último.
- Los datos incompletos continúan incompletos: no se suplen marcadores, ganadores, códigos ni enlaces de vídeo.
- El historial de 2.000 rallies y la combinación de sets vacíos se ejercitan en pruebas automatizadas.

## Publicación y retroceso

- `Volley_Coach_V20.6.2_SOLO_CAMBIOS.zip` contiene los archivos distintos respecto **exclusivamente a V20.6.1**. Si V20.6.1 está publicada, extraer y subir todos sus archivos a la raíz de GitHub Pages, preservando rutas y sobrescribiendo los nombres coincidentes.
- `Volley_Coach_V20.6.2_COMPLETO.zip` contiene el proyecto fuente completo y pruebas automatizadas.
- `Volley_Coach_V20.6.2_PUBLICACION_VITE.zip` contiene únicamente la distribución compilada lista para publicar en la raíz de GitHub Pages (contenido del ZIP, sin carpeta envolvente). No mezclar HTML antiguo con los nuevos scripts y Service Worker.
- Si se observan problemas, volver a publicar V20.6.1 sin borrar los datos ni restaurar automáticamente partidas.

## Límite de verificación

Las pruebas de TypeScript, integración con funciones reales y regresiones históricas son verificaciones de código. **No acreditan por sí solas** vídeo REC/Delay de dispositivos reales, persistencia durante una desconexión de corriente ni sincronización CAS/Supabase entre dos equipos físicos. La reestructuración completa y la eliminación definitiva de todas las capas heredadas siguen pendientes de validación funcional antes de una sustitución total.
