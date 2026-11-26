# Volley Coach V20.5.79 — comandos de rally (fase 6)

## Qué cambia

La envoltura de **Punto** y **Deshacer** en `021-core-scouting-v150-monolithic.js` consulta `window.VC_RALLY_COMMAND_LANE_20579` antes de delegar en las funciones históricas. Esta vía vive en TypeScript:

- `src/domain/scout-rally-command-lane.ts`: precondiciones, un solo despacho nativo y verificación de resultado.
- `src/domain/scout-rally-command-runtime.ts`: puente congelado con versión `20.5.79`, `nativeOnly` y `singleNativeWriter`.
- `src/vc2055-entry.ts`: instalación del puente Vite y exportación de la función pura.

Para **Punto**, se verifica que se ha añadido exactamente un rally y que solamente el marcador del ganador aumenta en uno. Para **Deshacer**, se verifica que desaparece exactamente un rally y se deja al código nativo toda la restauración de puntuación, rotaciones, alineación, acciones y tiempos de vídeo.

Se comprueba identidad de partido y set antes de llamar al escritor nativo. Tras llamar, se comprueba que sigue siendo el mismo objeto partido; se permite que el set actual cambie por una finalización legítima. Si la función nativa lanza una excepción después de modificar el estado, la vía **no reintenta**. Una mutación completa y verificable se reconoce como completada; una parcial se anuncia como fallo para revisión manual. Ninguna vía TypeScript modifica ni persiste puntos.

Cuando falta el puente Vite, la envoltura mantiene su comportamiento tradicional protegido: comprueba la identidad del partido y set, invoca el escritor histórico una vez y verifica el resultado. Si el puente lanza una excepción *antes* de despachar, puede usarse ese respaldo; nunca después de despachar.

## Lo que no se ha sustituido

- Escritores nativos de puntuación, rallies, deshacer, rotaciones y cambios de set.
- Editor profesional y registros de acciones, así como su guardado.
- Vídeo, tiempos, REC/Delay y datos originales de rallies.
- Persistencia local, IndexedDB, diario durable y sincronización CAS/Supabase.
- Funciones y llamadas públicas `window.scoutAwardPoint` / `window.scoutUndoRally`.

## Verificación automática

```bash
npm ci
npm run test:foundation
node --test --test-reporter=tap test-audit/v19320-compatibility-final-audit.test.cjs test-audit/v2001-sync-engine-reliability.test.cjs test-audit/v2011-durable-sync-journal.test.cjs test-audit/v2012-multi-device-validation.test.cjs
```

La prueba `vc20579-rally-command-lane.test.cjs` comprueba puntos sucesivos, Deshacer, cierre de set, cambios de partido/set, ganador incorrecto, excepción antes/después de mutar, puentes ausentes o defectuosos y ausencia de segundo intento.

## Publicación y cautelas

1. Descargar el ZIP `PUBLICACION_VITE` y desplegar **su contenido** en la raíz pública de la web estática, sin añadir otra carpeta envolvente.
2. No mezclar el `index.html` nuevo con scripts o `service-worker.js` anteriores. Vaciar la caché de la web si todavía se sirve la versión antigua.
3. Antes de operar en equipos reales, exportar una copia JSON y validar manualmente en otro navegador: punto propio/rival, set ganado, Deshacer, acciones y vídeo, cierre y reapertura, red intermitente y conflicto entre dispositivos.
4. `COMPLETO` contiene la fuente Vite y scripts históricos; `SOLO_CAMBIOS` se superpone sobre el proyecto completo **V20.5.78**.

Las pruebas automatizadas no sustituyen una prueba real de dispositivos, sincronización en condiciones de red o recuperación de una escritura parcial.
