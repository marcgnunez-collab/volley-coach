# Volley Coach V20.7.1 · Reducción segura de hojas de estilo

**Base necesaria:** V20.7.0 ya aplicada. Este es un cambio incremental **SOLO_CAMBIOS**.

## Qué mejora realmente

- Diez archivos CSS antiguos pasan a cuatro archivos agrupados por función: editor de vídeo, espacios profesionales, interfaz y fiabilidad global, y dispositivos/partido.
- Se eliminan **seis peticiones CSS** y seis archivos CSS activos. Los cuatro nuevos agrupan 110 623 bytes sin comprimir frente a 109 237 originales (los comentarios de trazabilidad añaden 1 386 bytes), pero gzip independiente por archivo baja de **24 681 a 22 620 bytes** (ahorro de **2 061 bytes**, medidos con Node `zlib`).
- Los bloques CSS internos están copiados **byte a byte** y **en su mismo orden**. Las hojas agrupadas siguen situadas en el lugar correspondiente dentro de `index.html`: no se alteran la cascada ni la prioridad de reglas por reordenación.
- `service-worker.js` pasa a precargar solo las cuatro hojas nuevas y renueva el identificador de caché.
- La auditoría de recursos sigue integrada en `npm run build`, y las pruebas V20.7.1 comprueban las huellas SHA-256 de las diez fuentes CSS originales.

## Instalación en GitHub

1. Asegúrate de haber publicado antes V20.7.0. Si tienes otros cambios propios, guarda una copia o una rama de seguridad.
2. Descomprime `Volley_Coach_V20.7.1_SOLO_CAMBIOS.zip` y sube sus archivos a GitHub **conservando rutas y nombres**. Sustituye los existentes cuando coincidan.
3. En el repositorio, elimina únicamente los diez CSS antiguos enumerados en `ELIMINAR_DE_GITHUB_V20.7.1.txt`. No elimines los cuatro `vc2071-*-unified.css`.
4. Publica los cambios y espera al despliegue. Si tienes PWA instalada, recárgala (en ocasiones dos veces) para que el nuevo service worker renueve la caché.
5. Comprueba las vistas de scouting, editor de vídeo, análisis, Match Mode y gestión de dispositivos, tanto en escritorio como en móvil.

**Importante:** no hace falta publicar también el ZIP `PUBLICACION_VITE`. Vite sigue siendo la herramienta para compilar los módulos TypeScript existentes; `SOLO_CAMBIOS` mantiene ese flujo de publicación y el orden de versiones.

## Límites y próximo bloque

Esta entrega reduce peticiones de estilos y archivos activos. **No elimina código JavaScript de negocio, no convierte el código histórico en TypeScript, y no cambia guardados ni escrituras.** La siguiente fase evaluará una reducción mayor de scripts JavaScript y módulos históricos por dependencias, verificando antes propietarios de datos, orden de arranque, Scouting, Vídeo, IndexedDB y sincronización CAS/Supabase.

Para recuperar el estado anterior se puede reinstalar V20.7.0 COMPLETO, que conserva los estilos separados.
