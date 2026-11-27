# Volley Coach V20.5.80 — migración del controlador de Punto y Deshacer (fase 7)

## Alcance real

Esta versión va un paso más allá del puente V20.5.79: tras cargar Vite, **el controlador completo** de los botones Punto y Deshacer reside en TypeScript. Incluye selección de partido/set, validación de partido abierto, prevención de doble pulsación durante el enfriamiento, ejecución de una única llamada nativa, verificación de marcador/historial, feedback de interfaz, actualización visual y diagnóstico agregado.

Los componentes nuevos son:

- `src/domain/scout-rally-controller.ts`: controlador de producción en TypeScript, sin acceso a DOM ni almacenamiento, con las operaciones `awardPoint` y `undoRally` y diagnóstico no identificativo.
- `src/domain/scout-rally-controller-runtime.ts`: fábrica inmutable registrada como `VC_RALLY_CONTROLLER_20580`.
- `src/vc2055-entry.ts`: instalación Vite y exportación de funciones TypeScript.
- `021-core-scouting-v150-monolithic.js`: adaptador fino para entregar a TypeScript las funciones nativas **ya existentes**. La envoltura V20.5.79 queda como respaldo si falla la inicialización **antes de despachar**.

### Camino de ejecución

1. La interfaz llama como siempre a `window.scoutAwardPoint` o `window.scoutUndoRally`, incluidas las envolturas históricas de vídeo/libero.
2. El adaptador obtiene una instancia única de `createLiveRallyController`.
3. TypeScript bloquea llamadas repetidas por comando durante el intervalo original de 120 ms, comprueba la identidad del partido/set y captura marcador y número de rallies.
4. La vía `executeNativeRallyCommand` llama al escritor histórico **una sola vez**, sin recalcular rotaciones ni reescribir rallies.
5. El controlador verifica el resultado, muestra el estado nativo y refresca la interfaz. Un fallo tras modificar datos **nunca** provoca un segundo intento automático.

La separación de los bloqueos de Punto y Deshacer es intencionada: el usuario sigue pudiendo deshacer un punto inmediatamente después de anotarlo, sin tener que esperar al bloqueo antirrepetición del botón Punto.

### Qué sigue fuera de este cambio

- No se migra todavía la implementación histórica del escritor de puntuación, rotaciones o restauración del rally.
- No se sustituye el sistema de persistencia local/IndexedDB, el diario durable ni el motor CAS/Supabase.
- No se modifican vídeo, REC, Delay, Live, clips ni los tiempos históricos.
- No se ejecutan migraciones destructivas, ni cambios de esquema, ni restauraciones automáticas.

## Pruebas

```bash
npm ci
npm run test:foundation
node --test --test-reporter=spec test-audit/v19320-compatibility-final-audit.test.cjs test-audit/v2001-sync-engine-reliability.test.cjs test-audit/v2011-durable-sync-journal.test.cjs test-audit/v2012-multi-device-validation.test.cjs
```

El archivo `vc20580-rally-controller-migration.test.cjs` comprueba la ruta real de la envoltura histórica al controlador TypeScript, 50 comandos consecutivos, Punto rival, Deshacer, enfriamientos independientes, finales de set, fallos parciales y completos, referencias obsoletas, ausencia de doble escritura, fallback si falla la instalación y conservación de las versiones de scripts y del service worker.

## GitHub y recuperación

- `SOLO_CAMBIOS`: aplicar sobre **V20.5.79**; añadir los nuevos archivos y sobrescribir solo los presentes. No borrar otros scripts.
- `COMPLETO`: proyecto fuente, dependencias declaradas, pruebas y documentación; instalar con `npm ci`.
- `PUBLICACION_VITE`: archivos estáticos ya compilados; publicar el **contenido del ZIP** en la raíz del sitio de GitHub Pages sin añadir una carpeta envolvente.
- Mantener una copia JSON previa del equipo y validar manualmente en dos dispositivos: puntos propios y rivales, set ganado, Deshacer, selección de partidos, vídeo, REC/Delay, sincronización offline/online y reapertura después de cerrar el navegador.

Las pruebas automatizadas no sustituyen una validación manual con dispositivos reales y una conexión Supabase efectiva. Si la versión publicada no carga, revertir los archivos al ZIP de publicación V20.5.79 sin sustituir los datos del navegador.
