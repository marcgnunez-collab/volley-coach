# Volley Coach V20.7.3 · Unificación de diagnósticos sin eliminar todavía

**Base requerida:** V20.7.2. **Publicación recomendada:** SOLO_CAMBIOS.

## Cambios de arquitectura

Tres scripts JavaScript de solo lectura que antes se cargaban de forma consecutiva pasan a un solo archivo `vc2073-diagnostics-unified.js`:

- V20.5.0: salud de publicación y recursos.
- V20.5.1: comprobación previa de Scouting Expert.
- V20.5.2: métricas de arquitectura/rendimiento.

El texto fuente se conserva byte a byte y en el orden original; se comprueban las API públicas y las huellas de las tres fuentes. La carga pasa de tres solicitudes JS a una, con ahorro de **987 bytes gzip** medidos en estos scripts. No hay cambios en los escritores de scouting, puntuación, vídeo, IndexedDB ni nube.

## Nueva decisión de limpieza

**No debes borrar ninguno de los archivos de las versiones V20.7.0, V20.7.1, V20.7.2 o V20.7.3 por ahora.** Los tres archivos originales de esta versión siguen incluidos deliberadamente. Los anteriores pueden permanecer en tu GitHub aunque no estén dentro de los ZIP COMPLETOS más recientes.

Un inventario acumulado de 26 candidatos queda disponible en `MIGRACION_PENDIENTES_DE_BORRADO_V20.7.3.md` y en `scripts/retained-legacy-assets.json`. La auditoría de build acepta solo esos archivos antiguos como pendientes de limpieza y falla si se vuelven a cargar o si aparece un recurso huérfano no inventariado.

## Pasos en GitHub

1. Comprueba que la versión anterior V20.7.2 ya está subida.
2. Descomprime `Volley_Coach_V20.7.3_SOLO_CAMBIOS.zip` y sube su contenido manteniendo rutas.
3. Sustituye los archivos que coinciden y añade el nuevo script unificado y el inventario de retención.
4. **No elimines ningún archivo.** Tampoco subas un ZIP VITE adicional si trabajas con SOLO_CAMBIOS.
5. Después del despliegue revisa Gestión → Auditorías y mantenimiento, Scouting Expert, Análisis y la barra lateral en PC y móvil.

El cierre de la migración contará con una limpieza final conjunta después de verificar la versión publicada con datos reales.
