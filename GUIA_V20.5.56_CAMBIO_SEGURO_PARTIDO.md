# Volley Coach V20.5.56 · Cambio de partido seguro durante una escritura

## Problema que se protege

En V20.5.55 los botones de punto y deshacer comparten una cola TypeScript. Si el usuario cambia rápidamente de partido mientras hay una operación en cola o un guardado en curso, la función nativa podría recibir el punto con otro scouting activo.

## Comportamiento de V20.5.56

1. Cada punto y deshacer queda asociado **a la referencia del partido activo cuando se pulsa**, no simplemente a su dorsal, nombre o identificador.
2. Un comando pendiente que llegue a ejecutarse después de un cambio de contexto se **descarta**, sin tocar ningún partido ni reintentarlo sobre el nuevo.
3. La selección que entra por `MatchState.select()` avisa a la cola de la intención de cambiar de partido, cancela los comandos aún no iniciados y **espera a que termine la operación nativa que ya estaba en curso**, incluido el retorno de la protección local existente.
4. Durante ese cambio no se aceptan nuevos comandos de punto y deshacer en la vía profesional. Una acción descartada devuelve `false` y presenta un aviso para comprobar el marcador.
5. Al finalizar el cambio, o si falla, se libera la barrera, evitando que el usuario quede bloqueado.

## Qué se conserva

El marcador, las rotaciones, los eventos de líbero, las acciones, vídeo, REC/Delay, `scoutSave`, IndexedDB y CAS/Supabase siguen bajo responsabilidad de sus **escritores nativos originales**. No hay reintentos, cambios de esquema, ni una nueva ruta de guardado.

## Instalación

- Antes de publicar, crea una copia JSON en **Gestión → Recuperación**.
- Desde **V20.5.55**, copia el contenido del ZIP `SOLO_CAMBIOS` a la raíz del repositorio, **manteniendo las carpetas**.
- Para instalar todo el código de cero, utiliza `COMPLETO`. Si publicas los archivos ya compilados con Vite, utiliza `PUBLICACION_VITE` únicamente como artefacto de despliegue.
- Verifica el despliegue y realiza las siguientes pruebas en un partido de prueba.

## Comprobaciones en Scouting

1. Registra un punto y deshazlo: deben recuperarse marcador, saque, rotación y acciones.
2. Pulsa dos veces consecutivas «Punto nuestro» y cambia inmediatamente de partido. Solo deben registrarse los puntos que hayan comenzado realmente antes del cambio; los pendientes deben descartarse y mostrar un aviso.
3. Comprueba que el partido de destino **no recibe esos puntos**.
4. Registra un punto nuevo en el segundo scouting y verifica que funciona.
5. Repite con un deshacer cancelado y una recarga de un scouting abierto.

## Diagnóstico y límites

`window.MatchState.diagnostics().rallyCoordinator.report` añade `contextDiscarded` (número de comandos rechazados por un cambio de partido o referencia restaurada) y `selectionPending` (barrera activa).

Esta protección se aplica a la vía profesional `MatchState.select()` + comandos `v121AwardPoint` y `v121UndoRally`, cuando ha cargado el módulo Vite. **No abarca aún las rutas históricas que llaman directamente a `scoutAwardPoint`, cambios de equipo ajenos a `MatchState` ni prueba por dos dispositivos reales.** Los guardados y la sincronización remota siguen requiriendo confirmación independiente: la barrera garantiza orden en memoria, no que el servidor haya recibido los datos.
