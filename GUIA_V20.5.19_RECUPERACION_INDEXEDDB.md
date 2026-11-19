# Volley Coach V20.5.19 · Recuperación desde el diario IndexedDB existente

## Qué incluye

La fase V20.5.19 sigue siendo **de arquitectura y comprobación**, sin sustituir el motor de Scouting ni activar nuevos puntos o guardados en los botones reales.

El módulo TypeScript `src/domain/journal-recovery-inspector.ts` utiliza la **API existente** `VC_SYNC_2011_JOURNAL.inspect(accountId)` y `VC_SYNC_2011_JOURNAL.newest(accountId)` del archivo **original** `210-vc2011-durable-sync-journal.js`.

No introduce un escritor a IndexedDB, un segundo sincronizador ni una lectura a Supabase. El diario existente continúa siendo el propietario exclusivo de sus lotes pendientes, incluidos borradores y subidas a la nube.

La comprobación:

1. Lee el estado del diario para la **cuenta activa indicada expresamente**.
2. Si hay cero copias pendientes, devuelve `no-checkpoint`, sin inventar datos.
3. Si hay varias revisiones pendientes, copias de otra cuenta o errores del diario, responde `ambiguous`, sin asumir un orden seguro.
4. Si existe **una sola** copia pendiente, consulta `newest(accountId)` y valida cuenta, estado pendiente, tipo de lote y tamaño.
5. Dentro de `stateJson` identifica el scouting por **equipo y ID exacto de partido**, en `equiposData[teamId].scoutingMatches`.
6. Compara la copia pendiente con las fotografías de antes y después del fallo, sin guardar ni aplicar esa copia.

La respuesta pública solo contiene estado y número de lotes, nunca nombres, códigos, jugadores, vídeo, identificadores de cuenta o contenido JSON.

## Interpretación correcta

| Resultado | Lectura segura |
| --- | --- |
| `checkpoint-before` | Existe una copia pendiente coincidente con el estado anterior al comando. |
| `checkpoint-after` | Existe una copia pendiente coincidente con el estado posterior. **No equivale a commit del partido ni a subida confirmada**. |
| `checkpoint-unchanged` | No hay diferencia observable entre las muestras comparadas. |
| `checkpoint-divergent` | La copia pendiente contiene otro estado. Revisión manual obligatoria. |
| `no-checkpoint` | El diario no tiene un lote pendiente para esa cuenta. |
| `missing-match` | La copia no contiene el scouting solicitado para ese equipo. |
| `ambiguous` | Hay varias revisiones, cuentas mezcladas o datos incompatibles. |
| `unavailable` | Falta información, hay errores de lectura o el JSON no es válido. |

**Todos los resultados requieren revisión manual y tienen `autoResumeAllowed:false`.** Una copia pendiente es una protección contra pérdidas, no una confirmación CAS. El piloto no reenvía rallies, no deshace acciones y no restaura estados automáticamente.

## Pruebas realizadas

- **146 pruebas automatizadas actuales** de TypeScript, Vite, reglas de voleibol, comparadores, motor nativo y recuperación.
- **39 pruebas históricas** de sincronización, diario durable, conflictos CAS y compatibilidad.
- **185 pruebas superadas en total**, sin errores.
- Auditoría estructural: **0 recursos referenciados ausentes y 0 imports de scripts duplicados**.
- Una prueba específica llama al **`createBrowserJournal` original** con una simulación controlada de la API IndexedDB, conserva la copia al recrear la ventana y comprueba que el bloqueo `VC2011_ORPHAN` sigue vigente.

### Prueba de navegador real preparada, pero pendiente

También se ha añadido `test-audit/vc20519-browser-recovery.test.cjs` y la página aislada `test-audit/vc20519-indexeddb-browser.html`.

El ensayo está diseñado para:

1. Iniciar Chromium con **un perfil temporal aislado**.
2. Guardar un borrador con el **diario V20.1.1 real** usando el IndexedDB del navegador.
3. Confirmar que la transacción de IndexedDB termina.
4. **Terminar el proceso Chromium de manera forzosa (SIGKILL)**.
5. Iniciar un segundo Chromium con el mismo perfil y comprobar que la copia sigue pendiente, que el inspector la clasifica correctamente y que `guardCleanPull` bloquea descargas peligrosas.

**Este ensayo NO ha podido completarse aquí**: Chromium está instalado, pero el sistema de ejecución devuelve un error de permisos al crear un socket local (`socket EPERM`). Por eso la prueba se registra como **omitida, no superada**. Ningún resultado de esta entrega debe interpretarse como prueba de cierre físico del navegador.

En un entorno Linux donde Chromium pueda abrirse se ejecuta, después de compilar, con:

```bash
npm run test:foundation
npm run test:browser-recovery
```

Para cambiar el ejecutable puede usarse `VC_CHROMIUM=/ruta/ejecutable`. El ensayo no requiere credenciales reales ni conecta a una cuenta Supabase.

## Estado de la instalación real

**No aparece una comprobación nueva en Gestión**, porque el inspector permanece exportado para pruebas, sin montar en la interfaz. No cambia los botones, el teclado rápido, las rotaciones, el vídeo, el diálogo de restauración ni la sincronización real.

La futura conexión a la app deberá:

1. Detectar la cuenta y el equipo actuales con las comprobaciones de permisos correspondientes.
2. Registrar las evidencias y el bloqueo recuperable sin introducir un nuevo escritor.
3. Usar el flujo existente de copias protegidas para cualquier recuperación manual.
4. Mantener la verificación independiente de CAS y recepción en otro dispositivo.
5. Superar pruebas reales de reinicio, modo avión, límites de almacenamiento, dos dispositivos, deshacer y finalización de sets.

## Actualizar GitHub

Repositorio: https://github.com/marcgnunez-collab/volley-coach

### `SOLO_CAMBIOS` si ya tienes V20.5.18

1. Descarga `Volley_Coach_V20.5.19_SOLO_CAMBIOS.zip` y descomprímelo.
2. Copia **el contenido** del ZIP a la **raíz** del repositorio, respetando las carpetas `src/domain/` y `test-audit/`.
3. **Añade** el nuevo inspector TypeScript, `vc20519-journal-recovery.test.cjs`, los dos archivos de prueba de navegador y esta guía.
4. **Sustituye** `src/vc2055-entry.ts`, `vc2055-domain-core.mjs`, `index.html`, `service-worker.js`, `package.json`, `package-lock.json`, `README.md` y las pruebas de versión incluidas.
5. Confirma los cambios, espera la publicación y recarga la PWA cuando se active el nuevo service worker.

No borres `210-vc2011-durable-sync-journal.js`, `209-vc2001-sync-reliability.js`, los módulos CAS `233`/`234`, Scouting, vídeo o demás scripts históricos.

### `COMPLETO` / `PUBLICACION_VITE`

- `COMPLETO` reúne la fuente y los tests, sin `node_modules` ni carpetas temporales.
- `PUBLICACION_VITE` contiene únicamente la publicación estática compilada. **No mezcles** su contenido con la raíz fuente de GitHub.

## Próximo paso técnico

Ejecutar el ensayo Chromium en un entorno autorizado, validar recuperación desde una pestaña realmente interrumpida y repetir con portátil y móvil reales. Solo con esas evidencias se puede plantear un modo de diagnóstico visible en Gestión y una activación gradual del bloqueo para partidos de prueba. La migración completa a módulos ES6/TypeScript sigue en marcha.
