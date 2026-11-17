# Volley Coach V19.3.19.1 · Professional Architecture & Unified Workspace

**Base exacta:** V19.3.19 COMPLETO. Actualización incremental y conservadora.

## Implementado

1. Navegación: Inicio, Club y equipos, Entrenamientos, Partidos, Análisis, Video Studio y Configuración. Reutiliza el router V17/V19 existente; no crea otro enrutador paralelo ni duplica las tarjetas que ya existen en Inicio.
2. Match Workspace: barra de acceso a Preparación, Scouting, Vídeo, Análisis, Banquillo e Informes. Cada botón abre la vista original.
3. Modelo informativo de datos: auditoría no destructiva de equipos, plantilla, scoutings, entrenamientos, planes, sets, rallies y contactos; aviso de identificadores duplicados.
4. Panel de integridad: descarga de respaldo JSON bajo acción explícita, lectura/validación de copias sin importar ni sobrescribir datos.
5. Actualización de caché y documentación de arquitectura, contratos, riesgos y plan de migración.

## Alcance y seguridad

- **No hay migración real de datos, modificaciones de Supabase, nuevas tablas ni eliminación de módulos heredados.** La primera fase produce un mapa de arquitectura y una capa unificada de navegación.
- La exportación necesita `estadoLocal()` de la aplicación y la generación de archivos habilitada por el navegador. Descarga y comprueba la copia antes de desplegar.
- Persisten **11 CSS referenciados y ausentes** en la versión base. Ver auditoría. No se suministran CSS vacíos.
- El selector de equipos clásico aún depende de `infantil` y `cadete`. La fase multiclub necesitará migración de almacenamiento y permisos.
- Comprobación aislada en Chromium y pruebas unitarias disponibles; la apertura del `index.html` completo por HTTP fue bloqueada por el entorno de pruebas (`ERR_BLOCKED_BY_ADMINISTRATOR`). No se declara validación completa del producto ni sincronización real.

## Instalación

- Si ya utilizas V19.3.19 COMPLETO: aplica el ZIP SOLO CAMBIOS respetando nombres y rutas.
- Para otras versiones: utiliza el ZIP COMPLETO y comprueba que no reemplaza CSS genuinos que tengas en GitHub con archivos inexistentes.
- Antes de publicar: exporta una copia JSON con el botón de recuperación existente, conserva una copia independiente y prueba con datos no críticos.

## Pruebas

- `node --test tests/*.test.cjs`
- `python tests/smoke_v193191_workspace.py` (aislada, Chromium, desktop y móvil)
- `python tests/smoke_v193191_fullapp.py` (requiere que el navegador permita abrir el servidor HTTP local)

## Pendiente antes de uso comercial

Migración reversible; inventario de CSS histórico; revisión de rutas de escritura; pruebas reales de nube y vídeo; validación de permisos entre clubes y usuarios.
