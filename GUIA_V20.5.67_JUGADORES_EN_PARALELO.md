# Volley Coach V20.5.67 · Copia paralela de jugadores (activación manual)

## Qué se ha migrado

Esta fase inicia una **escritura de entidades durante el uso real**, pero todavía sin cambiar cuál es el almacenamiento principal. El módulo TypeScript/Vite crea una réplica **aislada** de `jugadores` en IndexedDB (`VolleyCoachPlayerShadowV2067`): una fila por jugador con ID explícito y un catálogo transaccional que conserva orden y presencia del campo.

El guardado habitual `volleyCoachStateV43` en `localStorage` sigue siendo la **única fuente de verdad**. Los datos de entrenamientos, las estadísticas, el diario de scouting y la nube se mantienen en sus mecanismos actuales.

## Activación y comprobación

1. **Antes de probar**, exporta un JSON completo del club y consérvalo fuera del navegador. Comprueba que puedes abrirlo.
2. Utiliza una sola pestaña de Volley Coach durante esta prueba; no actives la copia en paralelo en otras pestañas.
3. En **Gestión → Repositorios locales de prueba**, localiza **V20.5.67 · Jugadores en paralelo**.
4. Pulsa **Activar copia paralela** y confirma que aceptas guardar una copia extra de datos personales **en ese dispositivo, solo durante esta sesión**. Se toma como punto de partida el último estado principal **ya confirmado**.
5. El módulo comprueba los IDs; si hay duplicados o ausentes, **detiene la copia** sin modificar el guardado principal.
6. Mientras permanezca activo, cada guardado local principal que termine correctamente deja preparada una réplica de **jugadores exclusivamente**, procesada de forma diferida. Los cambios rápidos se agrupan y los registros obsoletos se eliminan solo de esta copia aislada.
7. Pulsa **Comprobar jugadores** para contrastar con una lectura independiente y sin escrituras contra el último guardado original.
8. Pulsa **Detener copia** para que no se programen más escrituras; una transacción que ya haya empezado puede terminar.
9. Si quieres eliminar los datos duplicados, pulsa **Eliminar solo esta copia** y confirma. No toca el almacenamiento principal ni las copias JSON.

Tras recargar el navegador la copia paralela está **desactivada por defecto**. La base IndexedDB piloto puede seguir existiendo hasta que pulses su botón de eliminación o borres los datos del sitio.

## Seguridad y límites

- **Nunca bloquea ni reintenta el escritor principal**: si IndexedDB falla, se para este experimento y el guardado original continúa. No se envían los datos de la réplica a Supabase.
- El lector abre una conexión nueva y comprueba filas, orden y catálogo. No confirma recepción en otro dispositivo ni recuperación física después de un fallo brusco.
- La réplica puede contener nombres y datos personales de jugadores. Debe usarse únicamente con autorización y protección equivalente a la copia JSON del club.
- No se inventan IDs a partir del índice, dorsal o nombre. Una plantilla antigua sin IDs suficientes impide activar la réplica.
- Si varias pestañas o perfiles usan la misma copia, pueden interferir entre sí. **El despliegue comercial multiusuario no está preparado**.
- No se ha activado una lectura autoritativa ni una restauración al club desde esta base. Es la primera etapa de una migración gradual, reversible y monitorizada.

## Verificación automatizada

- `npm run test:foundation`: TypeScript, construcción de Vite y suite completa.
- `node --test vc20567-player-shadow.test.cjs`: validez de identidades, incrementalidad, aislamiento de datos, inspección `readonly`, fallos y activación voluntaria en Gestión.
- `node --test test-audit/*.test.cjs`: auditorías históricas; la prueba de Chromium depende de su disponibilidad real.

**Siguiente criterio de salida**: probar con datos reales anonimizados, cierres/reaperturas y conflictos entre pestañas antes de valorar el cambio de lectura o escritura autoritativa de jugadores.
