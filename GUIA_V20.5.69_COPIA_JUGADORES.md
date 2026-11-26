# Volley Coach V20.5.69 · Exportación comprobada de jugadores

## Avance de arquitectura

La réplica IndexedDB opcional de V20.5.67 permite ahora **reconstruir una copia JSON solo de las plantillas** a partir de filas individuales, con el orden de cada equipo y la distinción entre una plantilla vacía y un campo inexistente.

La exportación se autoriza únicamente cuando una sola transacción `readonly` confirma que todas las filas, su catálogo, su contenido y el orden coinciden con una instantánea del **último guardado principal confirmado**. Tras reconstruir, vuelve a comprobar que el guardado principal no haya cambiado.

Es un ensayo de recuperación; **no restaura nada**, no modifica el club y no sustituye el guardado original. El JSON exportado contiene datos personales de jugadores; no incluye vídeos, scouting, biblioteca ni datos de Supabase.

## Cómo utilizarlo

1. Haz antes una copia JSON completa del club mediante las herramientas habituales y guárdala fuera del dispositivo.
2. Ve a **Gestión → V20.5.67 Jugadores en paralelo** y activa la copia paralela para generar o actualizar la réplica desde un estado guardado y confirmado.
3. Espera al mensaje de copia verificada. Puedes detenerla si deseas.
4. Abre el nuevo apartado **V20.5.69 · Copia de recuperación**.
5. Pulsa **Descargar copia comprobada de jugadores** y confirma que aceptas exportar datos personales.
6. Si coincide todo, recibirás `Volley_Coach_Jugadores_AAAA-MM-DD.json`. Consérvalo en un lugar seguro y verifica que el navegador no haya bloqueado la descarga.

Si no existe réplica, faltan IDs, el club ha cambiado o se detecta corrupción, **no se descarga**. Debes revisar el origen y volver a generar una réplica desde el guardado principal. Nunca se aceptan filas antiguas como si fueran actuales.

## Seguridad

- La copia se prepara con un bloqueo exclusivo de Web Locks para evitar otra sesión de réplica escribiendo simultáneamente. La operación pausa primero las escrituras pendientes de esta pestaña.
- Sin Web Locks no se habilita la exportación protegida; la comprobación básica sigue siendo de solo lectura.
- Solo se usa `playerRows` y `playerManifest` de la base experimental `VolleyCoachPlayerShadowV2067`.
- La copia no puede importarse automáticamente como club completo. No uses el archivo de jugadores para reemplazar `volleyCoachStateV43`.
- La coincidencia no prueba durabilidad física tras un fallo del dispositivo ni sincronización con otro ordenador.
- Las pestañas con versiones anteriores de Volley Coach no respetan necesariamente el bloqueo nuevo; cierra otras sesiones antes de experimentar.

## Pruebas

- `npm run test:foundation`: TypeScript, Vite y regresión general.
- `node --test vc20569-player-shadow-backup.test.cjs`: reconstrucción fiel, orden, alcance de exportación, falta de réplica, IDs pendientes, corrupción, integridad y Gestión.
- `node --test test-audit/*.test.cjs`: auditorías históricas, con la prueba de Chromium sujeta a su ejecución real.

El cambio de fuente autoritativa del club sigue pendiente hasta validar cierres inesperados, recuperación y conflictos reales entre dispositivos.
