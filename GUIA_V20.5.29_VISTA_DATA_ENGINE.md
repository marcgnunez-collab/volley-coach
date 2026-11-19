# Volley Coach · V20.5.29 · Vista Data Engine en TypeScript

**Versión de partida: V20.5.28.** Esta entrega migra la generación HTML de la vista «Data Engine» a un componente puro de TypeScript, empaquetado con Vite. Mantiene el HTML histórico como respaldo si el módulo no se carga o produce un error.

## Qué se ha migrado

- Plantilla visual de contactos, filtros, métricas, posesiones y secuencias del Data Engine.
- Codificación segura de nombres y valores de acciones antes de mostrarlos.
- Puente de compatibilidad `VC_ANALYSIS_VIEW_20529` y diagnóstico de solo lectura en **Gestión → Rendimiento → Vista Data Engine migrada a TypeScript**.
- Pruebas de equivalencia exacta de HTML con los filtros y datos históricos, incluidos cambios y deshacer.

**Fuera de alcance:** editor nativo, puntuación, saques, rotaciones, vídeo, IndexedDB, backups y sincronización. Ninguno de esos escritores ha sido sustituido.

## Qué ZIP usar

1. **SOLO_CAMBIOS**: sobre V20.5.28 existente. Copia el contenido a la raíz de `volley-coach` y conserva las carpetas `src/` y `scripts/`. Sustituye los archivos con nombre coincidente.
2. **COMPLETO**: proyecto completo para empezar de cero o recuperar los fuentes. No incluye `node_modules`, que se instala con `npm install` si se va a desarrollar localmente.
3. **PUBLICACION_VITE**: contenido de `dist/` listo para servir. Sube el **contenido del ZIP** al directorio de publicación, sin crear una carpeta `dist` adicional.

No mezcles los tres paquetes. Si no tienes con seguridad la V20.5.28, utiliza **COMPLETO**.

## Cómo comprobarlo

1. Publica los archivos y espera a que GitHub Pages termine de actualizar.
2. Recarga la aplicación (el service worker cambia de versión).
3. En Scouting → Analizar → Data Engine, compara las tablas de contactos y colocaciones. Prueba filtros de fundamento y valoración.
4. Corrige una valoración de ataque y deshazla; las cifras deben recalcularse.
5. En Gestión → Rendimiento, pulsa «Actualizar medición» y verifica el contador «Plantillas TypeScript».

Si el nuevo módulo deja de estar disponible o falla, la vista histórica sigue funcionando; en ese caso el contador de plantillas no demuestra uso real y habrá que revisar la consola del navegador. No se afirma equivalencia real de vídeo o nube sin una prueba en dos dispositivos.
