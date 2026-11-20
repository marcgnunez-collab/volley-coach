# Volley Coach V20.5.55 · Escritor único para puntos y deshacer

## Qué cambia

- `MatchState.commands.awardPoint()` y `undoRally()` comparten una cola FIFO construida en TypeScript. Esta cola se activa solo cuando el módulo Vite publica `VC_RALLY_WRITER_20555`.
- Cada operación se entrega **una sola vez** a la función V12.1 original (`v121AwardPoint` o `v121UndoRally`). Esas funciones siguen llamando a `scoutAwardPoint`, `scoutUndoRally`, guardados de seguridad, vídeo y diario. No hay segundo motor de puntos ni segundo escritor de la nube.
- El coordinador compara la proyección tipada del punto o del deshacer con el estado real, registra discrepancias resumidas y detecta cambios parciales visibles tras errores nativos. No almacena códigos, nombres, dorsales ni estados privados en el diagnóstico.
- El puente se resuelve al registrar cada operación. Durante los primeros instantes de carga, o si falta el módulo Vite, se ejecuta el comando nativo capturado. Un error **después** de iniciar el coordinador nunca dispara una ejecución nativa alternativa.

## Cómo instalar

1. Haz una copia JSON del club desde **Gestión → Recuperación** antes de publicar.
2. Sube el ZIP completo si instalas una versión nueva; si vienes exactamente de V20.5.54, sube el ZIP de cambios, respetando los directorios `src/` y `scripts/`.
3. Si publicas mediante Vite, utiliza el ZIP de **Publicación Vite** en la carpeta raíz publicada, y no mezcles los archivos antiguos con el build.
4. Actualiza la página sin caché y verifica el número de versión del diagnóstico del sistema.

## Prueba manual después de publicar

En un partido **de prueba** (no en un partido oficial), registra un punto nuestro al recibir y comprueba que sumó exactamente uno, pasó el saque a nuestro equipo y avanzó la rotación cuando corresponde. Registra otro punto rival y deshazlo, confirmando que el marcador, saque, rotaciones y acciones recuperan los valores esperados. Repite pulsando dos puntos rápidamente y comprueba que no se pierde ni se duplica ninguna acción. Revisa el vídeo y exporta una copia JSON.

## Diagnóstico y límites

`window.MatchState.diagnostics().rallyCoordinator` devuelve `status: "active"` cuando la cola tipada está conectada y un `report` con `submitted`, `completed`, `pending`, `agree`, `difference`, `unverified`, `nativeRejected`, `nativeDeclined` y `partialMutations`.

- `agree` comprueba la transición observable; **no equivale a confirmación de escritura duradera o recepción cloud**.
- `nativeDeclined` puede incluir la cancelación del diálogo de deshacer. Una operación cancelada no suma puntos.
- La cola no engloba todavía otras rutas antiguas que llaman a `scoutAwardPoint` directamente; tampoco sustituye el antiguo escritor.
- La protección de bloqueo tras error (`requireRecoveryAfterNativeFailure`) **no se activa** en la UI de producción: necesita un lector local duradero y un flujo de recuperación explícito. No se afirma que el sistema sea totalmente transaccional ni que la arquitectura esté completamente migrada.
- La observación de errores no evita por sí sola que el escritor nativo cambie memoria antes de un fallo; ante una incidencia real, verifica el partido contra la copia protegida antes de seguir.

## Validación automatizada

`npm run test:foundation` incluye pruebas específicas de serialización, transición de puntos y deshacer, error sin reintento, ausencia de puente, activación tardía y confidencialidad del diagnóstico. Los tests históricos verifican puntuación, recuperación local y sincronización; hacen falta todavía pruebas completas en pabellón y en dos dispositivos reales.
