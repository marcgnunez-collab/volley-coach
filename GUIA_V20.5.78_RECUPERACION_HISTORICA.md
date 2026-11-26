# Volley Coach V20.5.78 — Recuperación histórica protegida

## Fase 5 de la reestructuración real

Esta versión refuerza las operaciones de recuperación de partidos existentes,
sin reemplazar el sistema de guardado ni abrir un segundo escritor.

La lectura de una copia de IndexedDB o de un archivo JSON es asíncrona. Antes,
la confirmación y la sustitución podían producirse después de que el usuario
hubiera cambiado de equipo o de partido, o mientras otro flujo actualizaba
el historial. Aunque la app ya impedía iniciar una recuperación con un partido
activo, esa comprobación inicial no cubría todo el tiempo de espera.

Ahora se crea un **comprobante temporal en memoria** con el club activo, la
selección, el objeto del partido y una firma completa del historial. El
comprobante no se guarda, sincroniza ni registra en diagnósticos.

El sistema vuelve a comprobarlo:

1. Después de obtener el checkpoint de IndexedDB o leer el archivo JSON.
2. Antes de mostrar la confirmación para reemplazar datos.
3. Después de la confirmación, inmediatamente antes de modificar los
   registros reales.

Si cualquier dato ha cambiado, la operación se cancela con un aviso y exige
volver a abrir la copia. También se impide la recuperación si un partido
finalizado ha pasado a estar activo durante la espera.

## Archivos de la migración

- `src/domain/scout-historical-restore-gate.ts`: captura y comparación pura
  de un comprobante transitorio. No almacena ni escribe.
- `src/domain/scout-historical-restore-runtime.ts`: puente inmutable
  `VC_HISTORICAL_RESTORE_LANE_20578`.
- `src/vc2055-entry.ts`: instalación mediante TypeScript/Vite.
- `021-core-scouting-v150-monolithic.js`: conexión con los controles reales
  de restauración e importación, conservando la confirmación y el único
  `scoutSave` original.
- `vc20578-historical-restore-guard.test.cjs`: simulaciones de carreras
  asíncronas y equivalencia de guardado.

## Qué NO cambia

- No se automatiza ninguna restauración: sigue requiriendo la acción y
  confirmación expresas del usuario.
- No se altera la estructura de los archivos JSON ni del checkpoint.
- El journal IndexedDB, guardado local, CAS/Supabase y la presencia entre PC
  y móvil continúan con sus responsables anteriores.
- No se modifica la suma de puntos, rotación, Deshacer, vídeo, REC/Delay,
  temporización ni marcadores históricos.
- El bloqueo previo de importación/restauración cuando hay un partido abierto
  continúa vigente.

Este comprobante protege contra cambios locales observables entre pasos,
pero **no representa una transacción distribuida** ni acredita que dos
dispositivos estén sincronizados. La reestructuración del almacenamiento y
estado global sigue pendiente.

## Pruebas

La nueva batería comprueba:

- Ticket inmutable y rechazo de un partido activo o contenido ilegible.
- Cambio de club, selección, objeto de partido, lista de partidos y datos
  modificados dentro de un registro.
- Lectura pendiente de IndexedDB, importación JSON mediante FileReader y
  cambios provocados durante la confirmación.
- Dos solicitudes de recuperación concurrentes: la segunda queda invalidada
  al finalizar la primera.
- Copia inexistente, JSON malformado y ruta clásica si no se ha cargado Vite.
- Guardado, renderización y cierre **una sola vez** en caso de éxito.

El resto de pruebas de scouting, editor de rallies, puntuación, recuperación,
análisis y sincronización se ejecutan sin modificar sus responsables.

## Comprobación manual antes de desplegar

1. Descarga y conserva una copia JSON completa del equipo.
2. Cierra el partido de prueba y abre **Gestión → Recuperación**.
3. Prueba un checkpoint de IndexedDB y una copia JSON conocida. Comprueba
   que la vista se restaura una sola vez después de confirmar.
4. Repite, pero cambia de equipo o de partido durante la lectura del archivo:
   la operación debe cancelarse, sin reemplazar el historial.
5. Intenta restaurar con un scouting abierto: debe continuar bloqueado.
6. Revisa partidas finalizadas, acciones, vídeos, Delay y Deshacer tras
   una recuperación voluntaria.
7. Compara PC/móvil, pendientes de sincronización y diario durable antes de
   volver a trabajar con datos reales.

No utilices un partido oficial como primer ensayo. Las pruebas automatizadas
no sustituyen las pruebas con cámara, navegador y Supabase reales.

## GitHub

- **SOLO_CAMBIOS:** extraer sobre la raíz de V20.5.77; subir archivos nuevos
  y sustituir homónimos, manteniendo `src/domain` y las demás rutas. No
  borrar scripts clásicos, datos, vídeos, CSS ni utilidades de recuperación.
- **COMPLETO:** copia íntegra del código fuente V20.5.78.
- **PUBLICACION_VITE:** archivos compilados para publicar en hosting
  estático; no mezclar con `src` dentro del repositorio fuente.

Revisa GitHub Actions, ejecuta `npm run test:foundation` y prueba
manualmente la restauración antes de utilizarla en un entorno real.

## Siguiente bloque

Consolidar los comandos de estado del scouting y sus cambios con garantías
de operación única, antes de emprender la sustitución autoritativa de
almacenamiento y los ensayos con dos dispositivos reales.
