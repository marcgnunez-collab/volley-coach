# Volley Coach · Migración V20.7.16

## Qué ha cambiado

Esta versión continúa la reducción de peticiones y duplicación de módulos en el arranque, partiendo de **V20.7.15**. Reúne diez scripts activos en solo dos bundles:

| Bundle activo | Scripts originales conservados dentro | Ejecución |
| --- | ---: | --- |
| `102-vc1601-analysis-performance.js` | 3: estadísticas de vídeo, salud de vídeo y rendimiento del análisis | Inmediata, como antes |
| `147-vc1730-analysis-workspace.js` | 7: planificador UI, flujo unificado, espacio profesional, auditoría, entrenamientos, partidos y análisis | `defer`, como antes |

La página hace **8 solicitudes JavaScript menos**. Los cuerpos de los diez scripts originales siguen en el mismo orden dentro de los dos bundles y las pruebas comprueban sus huellas SHA-256, el orden y la sintaxis. El ahorro de transferencia gzip frente a V20.7.15 ronda **6,3 KB** (6.332 bytes entre bundles y HTML); es una reducción de peticiones y bytes de transferencia, no una reescritura de todos los módulos a TypeScript.

## Archivos que hay que subir

Sube el contenido del ZIP **`Volley_Coach_V20.7.16_SOLO_CAMBIOS.zip`** sobre los archivos de V20.7.15 en GitHub, conservando las mismas rutas. El ZIP incluye únicamente archivos nuevos o modificados y no contiene los archivos anteriores que no han cambiado.

- **SOLO_CAMBIOS:** para continuar una publicación que ya contiene la V20.7.15 completa.
- **COMPLETO:** copia independiente de la aplicación clásica y sus archivos de desarrollo.
- **PUBLICACION_VITE:** versión construida desde Vite; **no la combines** con la publicación clásica ni la subas aparte si sigues desplegando `index.html` y scripts en GitHub.

## Compatibilidad y seguridad

- No se cambian el motor de puntuación, Punto/Deshacer, las rutas de escritura en IndexedDB, la sincronización con Supabase ni los escritores de vídeo.
- El `service-worker.js` actualiza su caché y precarga únicamente los bundles activos que corresponden a los scripts sustituidos.
- El inventario incorpora **8 candidatos** adicionales, para un total de **67 archivos históricos identificados, de los que 44 permanecen físicamente en el proyecto**. Los ocho de esta fase siguen guardados, fuera de la carga activa. **No borres los 44 restantes de GitHub hasta que cerremos la migración y verifiquemos la versión publicada**.

## Verificación y siguientes pasos

Ejecuta `npm run test:foundation`, las pruebas históricas `node --test test-audit/*.test.cjs` y `node scripts/audit-runtime-assets.mjs` sobre los ZIP descomprimidos. Después de actualizar GitHub, recarga forzando el service worker, comprueba apertura y cierre de barra lateral, navegación por entrenamientos/partidos/análisis, PDF, vídeo y las rutas de Punto/Deshacer. Prueba también los datos locales y la sincronización real entre dispositivos antes de retirar archivos.

**Pendiente:** extraer el núcleo restante a módulos TypeScript, validar interacción real en PC y móvil, verificar IndexedDB/Supabase/vídeo entre sesiones y retirar los 44 archivos candidatos todavía presentes solo tras comprobar ausencia de dependencias externas.
