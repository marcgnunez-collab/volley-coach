# Volley Coach V20.2.0 — Match Workspace Pro

## Base necesaria

La actualización incremental está preparada **exclusivamente sobre V20.1.2 completa**. Mantiene el Sync Engine 2.0, el diario durable y el diagnóstico de dos dispositivos. Si no tienes esa versión, no subas estos archivos encima de una versión anterior sin actualizar antes.

## ¿Qué tienes que subir a GitHub?

Descarga `Volley_Coach_V20.2.0_SOLO_SUBIR_GITHUB.zip`, descomprímelo y sube **estos cuatro archivos en la raíz del repositorio**:

| Archivo | Acción |
|---|---|
| `index.html` | Sustituir el existente |
| `service-worker.js` | Sustituir el existente |
| `212-vc2020-match-workspace.js` | Añadir nuevo |
| `vc2020-match-workspace.css` | Añadir nuevo |

No subas el ZIP directamente. **No borres ni reemplaces otros archivos**. Si los cuatro aparecen dentro de una carpeta después de descomprimir, entra en esa carpeta y sube los archivos individualmente a la raíz del repositorio. La carpeta `tests/` del ZIP completo es solo para desarrollo y no debe subirse para esta actualización.

## Pasos

1. Antes de actualizar, exporta copias de seguridad de los scoutings desde PC y móvil si ambos pueden tener cambios pendientes. Comprueba que esas copias se pueden abrir.
2. Desde GitHub, descarga una copia del repositorio o conserva la confirmación anterior como punto de retorno.
3. Ve a `Add file → Upload files`, sube los cuatro archivos y confirma con `Commit changes`.
4. Revisa que GitHub Pages termine de publicar. Abre la aplicación, fuerza la recarga (`Ctrl + F5`) y si usas la PWA instalada, ciérrala por completo y vuelve a abrirla.
5. Entra en `Partidos → Scouting` con un **partido de prueba**. Verifica que ves una única barra principal con cinco modos: Pista y acciones, Código directo, Vídeo + scouting, Revisar rallies y Datos en directo.
6. Verifica el marcador, la pista, los controles de líbero y rotaciones, el código rápido, REC, Live/Delay, el historial, la conexión y el contador de dispositivos. Comprueba los tamaños de vídeo/código heredados: Equilibrada, Vídeo grande y Código grande.
7. Registra una acción de prueba en un dispositivo; confirma su llegada al otro dispositivo y que el marcador **no** cambia inesperadamente. Comprueba también una corrección de rally y la persistencia tras recarga.

## Qué cambia

- Nueva cabecera única con equipo, rival, estado, set, rotación, rallies del set y acciones del rally actual; datos consultados al estado original de partido.
- Una única navegación visual de cinco modos usando el enrutador `vc52SetMode` existente.
- Acceso plegable a cinco rallies registrados, sin crear un historial paralelo de edición.
- Distribución visual de vídeo, código y pista más coherente, manteniendo las tres disposiciones de V19.3.19.6.
- Consolida la presentación de las barras antiguas sin eliminar su código ni sus funciones internas.
- No modifica Supabase, los datos del scouting, el motor de puntos, el vídeo, REC, Delay, IndexedDB ni el diario durable.

## Limitaciones y pruebas

- **168 pruebas automatizadas** superadas. Inspección sintáctica de **144 archivos JS** y **79 scripts internos** sin errores.
- Prueba de interfaz **aislada** en Chromium (1366 px y 390 px), con datos ficticios, sin desbordamiento horizontal y con cambio entre modos.
- **No está probada la aplicación completa en una sesión real**, con un partido real, REC/Delay y dos dispositivos físicos. Estas comprobaciones siguen siendo necesarias.
- El paquete original contiene referencias a **11 CSS históricos ausentes**. Si están en tu GitHub, consérvalos. No se han eliminado ni reemplazado por archivos vacíos.

## Recuperación

Si la nueva pantalla causa problemas, revierte `index.html` y `service-worker.js` a V20.1.2 y elimina los dos archivos nuevos. **No borres datos locales, IndexedDB, PWA, vídeos ni registros de Supabase como procedimiento de reversión**. Usa la exportación de seguridad solo si necesitas recuperar datos y después de comprobar el conflicto.
