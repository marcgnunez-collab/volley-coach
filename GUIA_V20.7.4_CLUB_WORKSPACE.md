# Volley Coach V20.7.4 · Club y navegación profesional unificados

**Base necesaria:** V20.7.3. **Para GitHub:** SOLO_CAMBIOS.

## Bloque de arquitectura consolidado

Cuatro scripts de interfaz y proyección de datos que se ejecutaban consecutivamente pasan a uno:

1. `202-vc193191-data-contract.js` — contrato y validación de copias en solo lectura.
2. `203-vc193191-unified-workspace.js` — navegación profesional y auditoría visual.
3. `204-vc193192-domain-adapters.js` — adaptación de equipos, temporadas y plantilla en solo lectura.
4. `205-vc193192-club-desk.js` — presentación del centro del club.

Se cargan mediante `vc2074-club-workspace-unified.js`, conservando **el código original y el orden de ejecución**. Las dos hojas CSS `vc193191-professional-workspace.css` y `vc193192-professional-club.css` pasan a `vc2074-club-workspace-unified.css`, también en el orden original.

**Resultado:** cuatro peticiones activas menos (tres JavaScript y una CSS). La compresión conjunta también reduce los bytes transferidos en estos recursos. **No se cambian** los propietarios de puntuación, edición de scouting, guardados, vídeo REC/Delay, IndexedDB o CAS/Supabase.

## Limpieza aplazada: NO BORRAR

Los seis archivos fuente continúan físicamente disponibles y quedan añadidos al inventario de revisión final. Ya son **32 candidatos acumulados** de V20.7.0–V20.7.4, pero **no debes borrar ninguno todavía**.

Puedes revisar todo el inventario en `MIGRACION_PENDIENTES_DE_BORRADO_V20.7.4.md`. La auditoría admite temporalmente estos archivos antiguos y evita que vuelvan a cargarse por error.

## Instalación

1. Asegúrate de tener la V20.7.3 aplicada.
2. Descomprime `Volley_Coach_V20.7.4_SOLO_CAMBIOS.zip`.
3. Sube los archivos a GitHub respetando rutas, sustituyendo los existentes y añadiendo los nuevos.
4. **No borres ningún archivo** de GitHub, ni de esta ni de las versiones anteriores.
5. Recarga la aplicación publicada y revisa Inicio, Gestión, Plantilla, temporadas, Scouting, Análisis y navegación escritorio/móvil.

No tienes que subir PUBLICACION_VITE aparte con SOLO_CAMBIOS. La limpieza definitiva se hará una vez finalizada y comprobada la migración.

El siguiente trabajo de mayor impacto se detalla en `PLAN_BLOQUES_PESADOS_V20.7.4.md`: `index.html` y los motores históricos de Scouting y Entrenamientos concentran el peso y requieren un plan de migración por responsabilidades.
