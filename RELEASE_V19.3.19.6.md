# Volley Coach V19.3.19.6 — Match & Video Workspace

**Base:** V19.3.19.5 completa. **Alcance:** presentación y navegación contextual del partido. No hay migración, eliminación de módulos ni cambios en Supabase.

## Cambios

- Pantalla de partido más compacta y coherente con la identidad profesional de V19.3.19.3.1.
- Tres disposiciones seleccionables **Equilibrada / Vídeo grande / Código grande** durante el modo `Vídeo + código`, sin desmontar el reproductor ni perder el estado del scouting.
- Layout compartido de reproductor original, panel de código rápido original y pista real. Los componentes de `vc54` se conservan, sin clonarlos.
- Barra operativa de partido, accesos a vídeo, foco de código, pista, últimos rallies y configuración de fuente; reutilizan comandos existentes.
- Seguimiento inferior para consulta de métricas y resultado del set con desplazamiento local.
- Se corrige en móvil el ancho mínimo heredado del contenedor del partido (prueba aislada a 390 px, sin scroll horizontal).
- La última versión del cockpit busca un id en el rally actual que en el HTML es una clase. Para evitar mover un componente que otra capa podría volver a renderizar, **se conserva el rally actual en el panel de codificación** y se incorpora un acceso a Revisión en el dock inferior. No se crea un segundo historial ni se inventan acciones.
- Solo se guarda la preferencia visual (`vc193196:match-layout:v1`) en `localStorage`; no se escriben datos deportivos.

## Instalar en GitHub

Si ya está desplegada la **V19.3.19.5**, **descomprime** `Volley_Coach_V19.3.19.6_SOLO_SUBIR_GITHUB.zip` y sube en la **raíz** del repositorio los siguientes cuatro archivos:

| Archivo | Acción |
|---|---|
| `index.html` | Sustituir |
| `service-worker.js` | Sustituir |
| `207-vc193196-match-video-workspace.js` | Añadir |
| `vc193196-match-video-workspace.css` | Añadir |

No subas el ZIP directamente a GitHub; no borres ningún otro archivo. No sobrescribas carpetas que contengan vídeos o registros. Haz una copia verificable de los scoutings/entrenamientos antes de actualizar; tras el commit, comprueba la publicación y recarga con Ctrl+F5. Si usas PWA, ciérrala y ábrela de nuevo.

**Si aún no tienes V19.3.19.5:** no instales el paquete incremental encima de una versión más antigua; primero actualiza conservando los archivos auténticos que ya tengas en GitHub y respaldando los datos.

## Comprobación recomendada en el partido

1. Abre un scouting **de prueba** y confirma que el equipo, puntuación, set y selector son los esperados.
2. Entra en `Vídeo + código`. Prueba las tres disposiciones. Comprueba que la cámara o el vídeo local **no se reinician** al cambiar de disposición.
3. Verifica que las teclas/código rápido, valoración, pista y marcador originales siguen funcionando.
4. Pulsa **Enfocar código**, **Fuente de vídeo**, **Últimos rallies**; vuelve a `Vídeo + código` sin que aparezcan reproductores o pistas duplicados.
5. Revisa el número de dispositivos conectados y la sincronización entre PC y móvil. Este paso requiere tu entorno real de Supabase.
6. Prueba escritorio y móvil; comprueba que no hay desbordamientos horizontales.

## Validación y limitaciones

- **117 pruebas Node automatizadas** aprobadas (110 anteriores y siete de esta versión).
- Prueba visual aislada en Chromium a **1440 px y 390 px**, con los nodos reales de partido y el adaptador antiguo de video/court: sin errores JS, sin desbordamiento horizontal y con cambios de disposición, foco de código, fuente y regreso desde Revisión funcionales.
- El navegador de pruebas no ha podido validar una **sesión completa** de la aplicación real ni Supabase con dos dispositivos. La compatibilidad con cámaras y Delay de un partido real queda pendiente.
- Persisten referencias CSS heredadas ausentes en el ZIP base; no se crean estilos falsos ni se eliminan sin auditar el repositorio remoto.

## Revertir

Revertir `index.html` y `service-worker.js` a V19.3.19.5 y retirar los dos archivos nuevos. No borrar datos de scouting, IndexedDB, localStorage ni registros cloud. La preferencia de disposición no afecta a los datos deportivos.
