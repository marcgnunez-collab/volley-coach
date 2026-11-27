# Volley Coach V20.7.5 · Primera extracción estructural de index.html

**Base:** V20.7.4. **Paquete recomendado:** SOLO_CAMBIOS. **No borrar nada de GitHub todavía.**

## Qué se ha extraído

- Un bloque de **69.201 bytes CSS** que estaba incrustado en `index.html` (`vc1843-embedded-video-styles`) se ha movido sin modificar un byte a `vc2075-video-styles-extracted.css`. Conservará el ID y la posición original en el DOM mediante `<link rel="stylesheet">`, y el service worker lo precarga.
- Dos scripts consecutivos de **tablas tácticas** y **arquitectura del análisis** se han unificado en `vc2075-analysis-ui-unified.js`.
- Tres scripts consecutivos de **montaje de vídeo, informes y banquillo** se han unificado en `vc2075-review-tools-unified.js`.

La fuente original de los cinco JavaScript sigue disponible para pruebas y recuperación. Cada función conserva su texto, las API públicas y el orden de inicialización. No se ha tocado el escritor de puntos, guardado, IndexedDB, CAS/Supabase ni las señales REC/Delay.

## Resultado

- `index.html` se reduce en torno a **69 KB sin comprimir**: el CSS principal de vídeo es ahora una hoja cacheable independiente, sin inflar cada lectura del HTML.
- Cinco scripts pasan a dos (tres peticiones JS menos); el CSS extraído añade una petición CSS, dando **dos peticiones activas netas menos**.
- La nueva caché precarga los tres recursos de reemplazo.
- Los **cinco JavaScript históricos** se suman al inventario de revisión final, que pasa a **37 candidatos**.

**Advertencia:** externalizar CSS puede hacer que su descarga dependa temporalmente de la red, a diferencia del bloque incrustado. La caché offline ayuda cuando el recurso ya se ha guardado, pero la comprobación visual en la aplicación publicada sigue siendo obligatoria.

## Qué debes subir a GitHub

1. Comprueba que V20.7.4 ya está aplicada.
2. Descomprime `Volley_Coach_V20.7.5_SOLO_CAMBIOS.zip` y sube sus archivos a las mismas rutas, sustituyendo los existentes.
3. **No borres ningún archivo**, ni los identificados en esta versión ni los de versiones anteriores.
4. No subas PUBLICACION_VITE aparte si utilizas el flujo SOLO_CAMBIOS.
5. Comprueba la carga de Vídeo, Scouting, Análisis, Montaje, Informes y Banquillo en escritorio y móvil, incluyendo una recarga de la PWA para renovar la caché.

## Próximo bloque de migración

Continuaremos separando el HTML y revisando los monolitos pesados por responsabilidades. Las partes con escrituras de datos necesitan ensayos reales con puntos, deshacer, REC/Delay y sincronización antes de reemplazar la ruta nativa.
