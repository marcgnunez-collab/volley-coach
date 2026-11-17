# V19.3.19.2 · Professional Club & Teams Workspace

**Base:** ZIP completo `Volley_Coach_V19.3.19.1_COMPLETO.zip`.

## Qué cambia

- Nuevo Centro del club en **Club y equipos** con resumen, selección de equipos existentes, plantilla consultable y temporadas explícitas.
- Dos adaptadores nuevos para leer los dominios sin escribir datos ni migrar el esquema.
- Accesos mediante el enrutador existente, edición de jugadores en su formulario original.
- Diseño profesional responsivo, sin duplicar el gestor de scouting, entrenamiento o nube.
- Revisiones de versión de navegación y caché del service worker.

**Archivos de código nuevos:** `204-vc193192-domain-adapters.js`, `205-vc193192-club-desk.js`, `vc193192-professional-club.css`.

**Archivos existentes cambiados:** `170-vc1900-unified-workflow.js`, `143-vc1700-professional-workspace.js`, `index.html`, `service-worker.js`.

**Pruebas y documentación nuevas:** `tests/v193192-club-desk.test.cjs`, `tests/smoke_v193192_club_desk.py`, dos capturas en `tests/`, `docs/ARCHITECTURE_V19.3.19.2_CLUB_DOMAINS.md` y este archivo.

## Instalación

- Si vienes de V19.3.19.1 **completa**, superpone «solo cambios» respetando las rutas.
- Si vienes de una versión anterior, utiliza el ZIP completo y conserva una copia verificable del estado original.
- Evita combinar el ZIP completo con una rama de GitHub distinta sin comparar cambios recientes.
- Después de desplegar, recarga sin caché y revisa la selección Infantil/Cadete; un conteo mostrado no confirma la sincronización con Supabase.

## Lo que no incluye

No crea clubes, temporadas o roles nuevos; no modifica autenticación/RLS/Supabase, no elimina módulos históricos y no prueba la sincronización real de 2 dispositivos. Las 11 referencias a CSS ausentes heredadas siguen pendientes.
