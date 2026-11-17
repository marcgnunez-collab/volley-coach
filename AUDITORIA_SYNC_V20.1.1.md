# V20.1.1 · Auditoría técnica de sincronización

## Arquitectura verificada

- Origen: `Volley_Coach_V20.1.0_COMPLETO.zip`.
- Escritor cloud único: script `v962-cloud-efficient-runtime`, alojado en `index.html`, tabla `volley_state`, CAS por `user_id + updated_at`.
- V20.1.0: política de reintentos (2–120 s), bloqueo por permisos/conflictos y panel de diagnóstico.
- V17.9: copias de protección IndexedDB previas a ciertas mezclas.
- V19.1.5 y V19.1.7: conflictos por registro, borrados y salvaguardias del motor histórico.
- El modelo de nube **no** admite todavía mutaciones independientes/idempotentes por contacto. No se simula esa compatibilidad.

## Implementación V20.1.1

1. `210-vc2011-durable-sync-journal.js`: diario local IndexedDB separado por cuenta con borrador rodante y lotes de subida pendientes.
2. El motor guarda una instantánea completa **antes** de escribir en Supabase, y espera al commit de IndexedDB. El error de almacenamiento cancela la subida (fail-closed).
3. Tras el acuse CAS, el diario retira el lote confirmado y las versiones estrictamente anteriores. Una edición nueva durante la subida conserva el indicador `dirty` y puede crear un nuevo borrador.
4. Al recargar, si aparece un lote pendiente pero el indicador local de edición se ha perdido, se bloquea una lectura remota automática para proteger la copia.
5. Exportación manual del último estado pendiente en JSON para la cuenta autenticada; no se aplica automáticamente sobre otros datos.
6. Reintentos idénticos no crean instantáneas nuevas por la fecha raíz `updatedAt`, porque el código la omite *solo en la comparación* de copias. Se guarda el JSON completo original.
7. Un solo borrador rodante durante trabajo offline evita generar una copia completa por cada contacto. Los lotes preparados para subida permanecen hasta el acuse. Hay un límite conservador de 16 subidas diferentes pendientes: si se alcanza, se bloquea la nueva subida para revisión.
8. Se conserva la cuenta de Supabase y las copias originales. Sin SQL, sin permisos nuevos y sin escritor alternativo.

## Pruebas

- 151 pruebas automatizadas del repositorio: correctas.
- 142 archivos JavaScript y 79 scripts integrados en `index.html` compilados sin error sintáctico.
- Pruebas simuladas: almacenamiento lleno, confirmación local fallida tras acuse remoto, borradores que sobreviven a un reinicio simulado, protección de cuenta, edición durante subida, no duplicación por `updatedAt` y estado pendiente huérfano.
- **No se ha podido validar IndexedDB mediante una página de Chromium real:** el navegador del entorno bloquea tanto `http://127.0.0.1` como `file://` con `ERR_BLOCKED_BY_ADMINISTRATOR`. Las pruebas usan un adaptador de almacenamiento simulado y prueban la lógica de confirmación del escritor con un Supabase simulado.
- No hay pruebas contra el Supabase del usuario, con dos dispositivos físicos ni bajo una desconexión real prolongada.

## Riesgos y trabajo pendiente para una versión comercial

- El diario contiene estados de usuario en IndexedDB local; pueden incluir datos privados. Requiere copias externas cifradas y política de retención en producción.
- En una pestaña o navegador sin IndexedDB disponible se bloqueará el escritor cloud, pero los cambios seguirán dependiendo del almacenamiento local existente. Hay que comprobar el espacio de disco en móviles.
- El límite de 16 lotes diferentes preparados sin acuse puede requerir revisión y extracción de copias. No debe limpiarse automáticamente sin corroborar el estado más reciente.
- Las garantías de idempotencia por acción, CAS monotónico administrado por servidor y separación multiclub requieren nueva estructura de tablas y una migración reversible con RLS, fuera de V20.1.1.
- Siguen ausentes 11 CSS históricos en el ZIP base (sin cambios en este release).

## Cómo diagnosticar en producción

Verificar por dispositivo: identidad de cuenta, revisiones pendientes, lotes del diario, último acuse CAS, última consulta remota, conexión Realtime, conflictos y exportación JSON. La conexión Realtime **no** es prueba de confirmación del servidor, y un acuse de subida **no** prueba que el otro dispositivo haya recibido la actualización.
