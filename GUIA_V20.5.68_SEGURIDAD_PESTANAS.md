# Volley Coach V20.5.68 · Bloqueo exclusivo de la réplica de jugadores

## Qué cambia

La copia paralela opcional de jugadores V20.5.67 sigue siendo **no autoritativa** y desactivada tras cada recarga. La V20.5.68 le añade un bloqueo exclusivo del navegador mediante **Web Locks** para reducir el riesgo de dos pestañas escribiendo simultáneamente en la réplica local.

- Solo una pestaña puede activar la copia paralela en el mismo origen.
- Si otra pestaña tiene el bloqueo, la activación falla sin programar ninguna escritura.
- El bloqueo permanece reservado durante toda la sesión activada, incluso entre guardados, y se libera después de terminar las transacciones ya iniciadas.
- Si llega un evento `storage` indicando que otra pestaña modificó el estado principal `volleyCoachStateV43`, se pausa la réplica y hay que comprobarla y reactivarla manualmente.
- Al salir de la página (`pagehide`) también se pausa; nunca se reanuda sola.
- El borrado de la base de prueba **también exige el bloqueo exclusivo**; si otra pestaña está trabajando no se elimina.
- En navegadores sin Web Locks, activación y borrado permanecen deshabilitados; la lectura de comprobación puede seguir disponible.

## Cómo probarlo sin arriesgar datos

1. Conserva una copia JSON fuera del navegador y utiliza datos de prueba.
2. Abre dos pestañas de la misma publicación de Volley Coach.
3. En la primera, entra en Gestión y activa **V20.5.67 · Jugadores en paralelo**.
4. En la segunda, intenta activarlo: debe mostrar que otra pestaña ya usa esa copia, sin escribir.
5. Desactiva la copia de la primera y espera a que termine una posible operación.
6. Activa la segunda: ahora debería permitirlo.
7. Modifica el club en la primera pestaña. La segunda debe detener la copia paralela al recibir el cambio de almacenamiento principal.
8. Comprueba desde Gestión el estado de los jugadores. Si hay diferencias, no las restaures automáticamente. Conserva el guardado original.

La función sigue usando exclusivamente la base de prueba `VolleyCoachPlayerShadowV2067`; el scouting, entrenamiento, vídeo, marcador, Supabase y su mecanismo de sincronización no se modifican.

## Lo que todavía no acredita esta versión

- No es una prueba de recuperación tras apagado brusco ni ante caída del dispositivo.
- Web Locks coordina **las pestañas que usan el nuevo mecanismo**, pero no impide cambios de los módulos clásicos ni de versiones antiguas abiertas en otras pestañas.
- No constituye bloqueo distribuido entre móviles y ordenadores. La réplica solo es local a ese origen/perfil.
- No se ha activado IndexedDB como fuente principal ni la restauración desde esta réplica.

## Verificación

- `npm run test:foundation`: typecheck, Vite y pruebas de regresión.
- `node --test vc20568-player-shadow-lock.test.cjs`: bloqueo exclusivo, competencia entre dos sesiones, liberación, eventos de almacenamiento, salida de página y navegador sin Web Locks.
- `node --test test-audit/vc20519-browser-recovery.test.cjs`: prueba real con Chromium si el entorno permite iniciar el navegador y su puerto de DevTools. En el entorno automatizado actual **no ha podido arrancar**, por lo que esa validación sigue pendiente.

Antes de cambiar la fuente principal de jugadores es necesario superar también las pruebas reales de reconexión, cierre brusco, múltiples pestañas y compatibilidad con la versión desplegada del club.
