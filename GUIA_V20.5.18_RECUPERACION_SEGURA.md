# Volley Coach V20.5.18 · Ensayo de recuperación y bloqueo seguro

## Qué hemos hecho

**Fase de arquitectura y laboratorio, no activación en producción.** El piloto transaccional de V20.5.16–V20.5.17 continúa exportado como ES6/TypeScript, pero **no está conectado al teclado, a los botones, al vídeo ni a los escritores de Scouting**.

Los dos módulos implicados son:

- `src/domain/rally-recovery-evidence.ts`: captura inmutable y compara una muestra del partido actual en memoria con una muestra persistida **leída** de forma independiente.
- `src/domain/rally-transaction-pilot.ts`: permite inyectar el lector original `readDurableLocal` y activar opcionalmente `requireRecoveryAfterNativeFailure`.

La muestra compara identidad del partido y set, marcador, saque, rotaciones, estado y tanteos de los sets, rallies y acciones activos, alineaciones, líbero y referencias temporales de vídeo. Solo inspecciona el rally actual y el último cerrado, no reescanea una temporada entera. Las muestras **no se guardan ni se muestran** en los informes del piloto; solo quedan categorías y contadores anónimos.

## Estados de recuperación

| Evidencia | Qué significa | Actuación |
| --- | --- | --- |
| `durable-before` | El registro local persistido coincide con el estado previo al comando que falló, aunque la RAM haya cambiado. | No volver a ejecutar el comando. Recargar el registro local con el mecanismo original y verificarlo. |
| `durable-after` | El estado persistido local coincide con lo observado tras el comando fallido. | No duplicar el punto. Revisar si queda sincronización pendiente antes de seguir. |
| `divergent` | El registro local no coincide de forma íntegra con el anterior ni con el posterior. | Bloquear y resolver manualmente con copia/diario y auditoría. |
| `unchanged-observed` | No hay diferencias observables entre los tres fotogramas de estado. | No demuestra recepción en la nube ni autoriza repetir automáticamente el punto. |
| `unreadable` | Falta evidencia o el almacén no se puede leer, o la identidad del partido no se puede comprobar. | Mantener bloqueado; no afirmar que se guardó. |
| `not-configured` | El consumidor no ha proporcionado el lector persistente original. | No dar por validada la recuperación. |

Son **pruebas de persistencia local**, nunca confirmaciones de Supabase, de entrega a otro dispositivo o de un CAS completo. Para producción todavía hay que comprobar por separado diario, revisión y acuse remoto.

## Bloqueo y reanudación

El bloqueo **está desactivado por defecto**:

```ts
const pilot = createRallyTransactionPilot(port, {
  requireRecoveryAfterNativeFailure: true,
  startBlockedForPendingRecovery: false
});
```

- `port.awardPoint` y `port.undoRally` son las **funciones nativas originales**. El piloto nunca reimplementa puntos, guardados ni CAS.
- `port.readCurrent` lee el partido activo. `port.readDurableLocal` debe devolver una lectura local realmente persistida, desde el propietario original del almacenamiento y no desde la misma referencia en RAM.
- Si el comando nativo lanza una excepción o devuelve `false`, el piloto conserva ese mismo resultado, identifica el tipo de evidencia y, con la opción activada, **bloquea los siguientes comandos**, incluidos los que ya estaban esperando en su cola.
- Tras solucionar el problema mediante el procedimiento original, un operador puede invocar `await pilot.resumeAfterVerifiedReload()`. Solo devuelve `true` si las lecturas independientes (RAM y registro persistido) son completas, corresponden al mismo partido y coinciden. No reescribe nada.
- Para ensayar un reinicio que detectó un conflicto en el **diario duradero ya existente**, `startBlockedForPendingRecovery:true` comienza bloqueado sin escribir una nueva marca de recuperación.
- `disable()` sigue impidiendo nuevas operaciones. Todo el protocolo sigue desconectado de la interfaz real.

**Limitación importante:** el piloto todavía no escribe ni recupera por sí mismo una marca duradera a través de un cierre brusco del navegador. Esa integración debe hacerse con el diario IndexedDB existente, con lectura confirmada y sin introducir un segundo escritor. El ensayo de reinicio reproduce el traspaso de una marca pendiente por un consumidor que la conoce, **no demuestra que el producto actual la detecte automáticamente al abrirse**.

## Pruebas de la entrega

El archivo `vc20518-recovery-guard.test.cjs` contiene **13 nuevas pruebas**:

1. Función original de punto en VM: muta marcador pero el guardado local falla antes del commit.
2. Función original de punto en VM: el commit ocurre y después se produce el error.
3. Reanudación únicamente después de recargar y verificar el registro local.
4. Reinicio simulado con una marca pendiente conocida por el diario existente.
5. Evidencia local divergente.
6. Error al leer el almacenamiento persistido.
7. Ausencia de lector de persistencia.
8. Identidad de partido distinta o ausente.
9. Estado sin cambios, sin declararlo confirmado en nube.
10. Bloqueo de comandos encolados tras la primera operación fallida.
11. Compatibilidad con el piloto anterior cuando el bloqueo no está activado.
12. Privacidad y anonimización de las incidencias.
13. Integridad de los módulos y escritores históricos.

Con las pruebas anteriores: **134 pruebas actuales** de TypeScript, Vite y arquitectura + **39 históricas** de compatibilidad, sincronización, conflicto CAS y recuperación = **173 pruebas automatizadas**.

Las pruebas de persistencia usan funciones originales de Scouting ejecutadas con un almacén **simulado en VM**. No se ha probado una caída física del navegador, un IndexedDB real corrupto ni una transmisión con dos dispositivos reales. Esto sigue siendo imprescindible antes de cualquier activación.

## Protocolo de activación gradual (sin modificar Scouting ahora)

1. **Fase A (actual):** API aislada y opt-in; no accesible desde la UI real. Mantener auditorías read-only en Gestión.
2. **Fase B (pendiente):** integrar solo el lector confirmado del diario IndexedDB existente. Ensayar fallo antes/después del commit, reinicio real de pestaña, modo avión, duplicados y pérdida de cuota.
3. **Fase C (pendiente):** un modo de diagnóstico local para una cuenta de pruebas, sin sustitución de comandos. Verificar que vídeo, líbero, cierre de set, undo y recuperación se mantienen correctos.
4. **Fase D (pendiente):** activar el bloqueo de recuperación para un partido de pruebas, con copia previa y procedimiento de desactivación. Nada de reintentos ciegos.
5. **Fase E (pendiente):** ensayo portátil + móvil y CAS/Supabase reales; comprobar entrega, conflictos, reconexión, clips y restauración. Solo entonces considerar activación gradual en partidos normales.

## Actualizar GitHub

Repositorio: https://github.com/marcgnunez-collab/volley-coach

### Si ya tienes V20.5.17: `SOLO_CAMBIOS`

1. Descarga `Volley_Coach_V20.5.18_SOLO_CAMBIOS.zip`.
2. Descomprímelo y copia **su contenido** a la raíz del repositorio, conservando `src/domain/`.
3. Añade `src/domain/rally-recovery-evidence.ts`, `vc20518-recovery-guard.test.cjs` y esta guía.
4. Sustituye `src/domain/rally-transaction-pilot.ts`, `src/vc2055-entry.ts`, `vc2055-domain-core.mjs`, `index.html`, `service-worker.js`, `package.json`, `package-lock.json`, `README.md` y las pruebas de versión incluidas.
5. Confirma los cambios y espera la publicación. Recarga la PWA tras la activación del nuevo service worker.

**No borres** el monolito `021-core-scouting-v150-monolithic.js`, los scripts `233`/`234`, el motor de vídeo, el diario IndexedDB, CSS históricos ni el resto de JS numerados.

### `COMPLETO` y `PUBLICACION_VITE`

- `COMPLETO`: contiene el repositorio fuente completo y los tests históricos (sin `node_modules` ni compilaciones temporales). Haz copia si tienes cambios propios después de V20.5.17.
- `PUBLICACION_VITE`: contiene el resultado `dist/` para un servidor estático; no debe mezclarse dentro de la raíz del repositorio fuente.

## Qué falta para completar la estructura

Todavía hay scripts históricos y envoltorios que deben consolidarse gradualmente. La siguiente fase técnica será conectar **solo en pruebas** este protocolo al diario real de persistencia, manteniendo el control nativo del marcador y las verificaciones de CAS. La migración completa a una arquitectura modular seguirá por componentes y con pruebas de regresión.
