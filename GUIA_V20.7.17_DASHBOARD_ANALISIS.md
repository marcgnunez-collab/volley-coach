# Volley Coach · V20.7.17 · Paneles y análisis profesional

## Objetivo

Continuar la reestructuración progresiva de Volley Coach desde la **V20.7.16**, reduciendo solicitudes de JavaScript y el peso comprimido **sin modificar la lógica original** ni los responsables de escritura de partidos, jugadores, vídeos o almacenamiento.

## Consolidaciones

| Bundle cargado | Scripts originales incluidos | Funcionalidad | Carga |
| --- | ---: | --- | --- |
| `153-vc1780-cross-analysis.js` | 4 | Producción de vídeo, flujo rápido de Scouting, herramientas de vídeo y análisis cruzado | Diferida |
| `166-vc1860-training-planner.js` | 4 | Pulido de vídeo, inicio, centro de partidos y planificador de entrenamientos | Diferida |
| `193-vc19312-video-scoreboard.js` | 10 | Estadísticas tácticas, colocadores, rival, buscador de rallies, pantallas profesionales y marcador de vídeo | Diferida |

Cada uno conserva los cuerpos exactos de sus scripts originales como funciones autoejecutadas independientes, preservando su secuencia. Se mantienen en el ZIP completo los archivos antiguos para facilitar la revisión y la retirada futura.

**Resultado:** 18 scripts se ejecutan en 3 descargas de JavaScript, **15 solicitudes menos**. El ahorro total de compresión frente a V20.7.16 ronda **13,3 KB gzip** sumando bundles y HTML. No supone que todo el núcleo haya sido reescrito en TypeScript.

## Publicación en GitHub

1. Confirma que la publicación ya incorpora todos los cambios de **V20.7.16**.
2. Abre **`Volley_Coach_V20.7.17_SOLO_CAMBIOS.zip`**.
3. Sube **únicamente** los archivos y carpetas que contiene a las mismas rutas en GitHub, sobrescribiendo las versiones anteriores.
4. Conserva los archivos que el ZIP no incluye. **No elimines todavía archivos antiguos en GitHub**.
5. Espera a que GitHub Pages publique y recarga el navegador forzando la actualización de la caché del service worker.

El ZIP **COMPLETO** sirve para reconstruir o auditar el proyecto entero. **PUBLICACION_VITE** es una compilación alternativa para otro despliegue: no hace falta mezclarla ni subirla si sigues publicando la variante clásica.

## Seguridad y pruebas

- Las dos funciones nativas de Punto y Deshacer, los diarios IndexedDB, Supabase y la escritura de vídeo permanecen fuera de los tres nuevos bundles.
- Las comprobaciones congelan las huellas SHA-256 de los 18 cuerpos originales, su orden, aislamiento y semántica `defer`.
- El service worker utiliza las tres rutas activas y deja de precachear las 12 rutas reemplazadas que tenía en su lista.
- El inventario tiene **82 candidatos históricos**; de ellos **59 siguen físicamente presentes**. Su retirada requiere la validación final de la aplicación publicada, no solo pruebas automatizadas.

## Pruebas manuales que siguen pendientes

En PC y móvil: abrir/cerrar la barra lateral, navegar por inicio y partidos, preparar entrenamientos, elegir Scouting, reproducir vídeo con marcador, ver análisis y PDF, registrar/deshacer puntos, cerrar y recuperar sesiones y validar dos dispositivos Supabase en una cuenta real.

El objetivo por hitos será revisar el avance global en **intervalos estimados del 5%** después de una entrega probada. Este porcentaje no sustituye la validación real en GitHub y dispositivos.
