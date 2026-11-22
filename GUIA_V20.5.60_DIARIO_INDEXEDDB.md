# Volley Coach V20.5.60 · Diario IndexedDB con transacciones TypeScript

Base: V20.5.59. Esta etapa traslada **escrituras reales**, sin crear otra base de datos ni cambiar el formato de los scoutings.

## Qué se ha migrado

El diario original `VolleyCoachScoutJournalV902` conserva su versión **2** y sus dos almacenes:

| Almacén original | Uso | V20.5.60 |
| --- | --- | --- |
| `liveMatches` | Checkpoint completo del partido | `put` dentro de una transacción TypeScript. |
| `liveRallies` | Avance del rally en curso | `put`/`delete` dentro de la **misma** transacción. |

El módulo `src/domain/scout-indexed-journal.ts` tiene dos operaciones:

- **`checkpoint`**: guarda el partido completo y retira el delta del rally anterior de manera atómica.
- **`action-delta`**: guarda el avance del rally. Si todavía no existe una base, crea en esa misma transacción el checkpoint inicial y el delta. No sobrescribe un checkpoint o delta más reciente con una acción antigua.

La promesa termina correctamente **solo tras `transaction.oncomplete`**. Si la operación falla o la transacción se aborta, el sistema anterior registra el error. **No vuelve a ejecutar esa misma escritura por una ruta alternativa.**

## Qué sigue siendo nativo

- Abrir / actualizar la base IndexedDB y detectar cambios de versión.
- Capturar la instantánea del partido antes de esperar a IndexedDB.
- Normalizar y recuperar rallies, marcador, rotaciones, líberos y vídeos.
- Guardado general `localStorage`, copia protegida JSON y diario CAS/Supabase.

Si todavía no se ha cargado el módulo TypeScript, la rama nativa original continúa operativa. Nunca escriben las dos ramas para el mismo comando.

## Diagnóstico sin datos personales

En la consola del navegador:

```js
window.scoutV902PerformanceDiagnostics?.()
```

Nuevos contadores:

- `typedCheckpoints`, `typedDeltas`: transacciones TypeScript **completadas**.
- `nativeCheckpoints`, `nativeDeltas`: transacciones históricas completadas por ausencia del módulo.
- `typedFailures`: errores de transacciones TypeScript, sin reintento automático.

Los contadores no contienen nombres, dorsales ni códigos del scouting. `journalFailures` del motor antiguo sigue reflejando incidencias. Que una operación esté en IndexedDB **no confirma su llegada a Supabase ni su persistencia ante un corte eléctrico**.

## Instalación en GitHub

1. **Exporta primero una copia JSON de seguridad**. Conserva tu V20.5.59 hasta verificar la instalación.
2. Si tu repositorio está en **V20.5.59**, descomprime `Volley_Coach_V20.5.60_SOLO_CAMBIOS.zip` y sube **todos** los archivos conservando rutas y sustituyendo homónimos.
3. Para reconstruir el código fuente desde cero, usa `Volley_Coach_V20.5.60_COMPLETO.zip`.
4. Si publicas archivos ya compilados y no compilas Vite en GitHub, publica el contenido de `Volley_Coach_V20.5.60_PUBLICACION_VITE.zip`, sin mezclarlo con otra versión.
5. Espera la actualización del *service worker* y recarga la aplicación.

## Pruebas manuales obligatorias

1. Con un partido **de prueba** y sin nube, añade varias acciones, cierra rallies, deshaz y comprueba marcador, servicio y rotaciones.
2. Cierra totalmente el navegador, vuelve a abrir y verifica que se recuperan las acciones y los rallies correctos.
3. Repite desde móvil y portátil. Comprueba la sincronización **desde el segundo dispositivo**, no solo desde el indicador del primero.
4. Si hay incidencia del diario o una advertencia roja de lectura local, exporta JSON antes de intentar recuperar; no borres IndexedDB ni `localStorage`.

## Lo que aún falta para la arquitectura definitiva

El diario de scouting ya tiene sus operaciones transaccionales migradas, pero el guardado de todo el club y otras rutas todavía dependen del código histórico. Antes de sustituirlo hará falta un contrato de persistencia unificado, pruebas reales de recuperación tras fallo del proceso y validación sincronizada de dos dispositivos.
