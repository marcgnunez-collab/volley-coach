# Volley Coach V20.1.2 — Instalación y validación entre PC y móvil

## Base necesaria

**Instala este paquete incremental únicamente sobre V20.1.1 completa.** Si no sabes qué versión está desplegada, no sobrescribas archivos todavía: conserva una copia del repositorio y comprueba los nombres de módulo en `index.html`.

## Antes de actualizar

1. Detén partidos y entrenamientos que se estén editando. No uses los dos dispositivos para editar mientras se publica la nueva versión.
2. En **cada dispositivo** exporta sus scoutings y entrenamientos a JSON y guarda una copia fuera del navegador. Comprueba que los archivos contienen `equiposData`.
3. Revisa los cambios pendientes y los conflictos en **Dispositivos y nube**; si existen, exporta el diario antes de actualizar.
4. Descarga una copia del repositorio o conserva el commit anterior de GitHub para revertir la interfaz sin borrar IndexedDB.

## Qué subir exactamente a GitHub

Descomprime `Volley_Coach_V20.1.2_SOLO_SUBIR_GITHUB.zip`. Contiene **8 archivos** organizados de esta forma:

### Raíz del repositorio — necesarios para que funcione V20.1.2

| Archivo | Acción |
|---|---|
| `index.html` | **Sustituir** |
| `service-worker.js` | **Sustituir** |
| `211-vc2012-multi-device-validation.js` | **Añadir** |
| `vc2012-multi-device-validation.css` | **Añadir** |

### Carpeta `tests/` — actualización de pruebas del repositorio

| Archivo | Acción |
|---|---|
| `tests/v2012-multi-device-validation.test.cjs` | **Añadir** |
| `tests/v2011-durable-sync-journal.test.cjs` | **Sustituir** |
| `tests/v2001-sync-engine-reliability.test.cjs` | **Sustituir** |
| `tests/v19320-compatibility-final-audit.test.cjs` | **Sustituir** |

Si subes archivos con la interfaz web de GitHub, entra primero en la **raíz** para subir los cuatro primeros y después abre `tests/` para subir los cuatro de pruebas. Mantén los nombres exactamente iguales. **No subas los ZIP como archivos individuales ni crees una carpeta `volley-coach-main` dentro de la raíz. No borres ningún archivo.**

Los archivos de `tests/` no se cargan en la web; son importantes para mantener las comprobaciones automatizadas del repositorio en la versión correcta.

## Publicación

1. En GitHub, confirma los ocho archivos con **Commit changes**.
2. Comprueba que GitHub Pages ha publicado el nuevo commit.
3. En PC, realiza una recarga completa (`Ctrl + F5`). En móvil/PWA, cierra la aplicación completamente y vuelve a abrirla.
4. En **Dispositivos y nube** comprueba que aparece el panel **V20.1.2 · Validación PC + móvil** y que el diario V20.1.1 continúa accesible.
5. Verifica que las modificaciones en un partido de prueba se ven en ambos dispositivos.

## Prueba real de doble dispositivo (obligatoria antes de afirmar que es fiable)

Usa únicamente un **scouting de prueba** y la misma cuenta autenticada en ambos dispositivos.

1. Deja el móvil sin editar y realiza una modificación identificable en el PC (por ejemplo, corregir una valoración en un rally de prueba).
2. Sincroniza el PC y comprueba que no hay cambios pendientes ni errores. El panel mostrará la última versión **subida** al servidor.
3. En el móvil abre ese mismo scouting, solicita la comprobación de nube y comprueba **visualmente que la acción aparece con el valor correcto**.
4. En el móvil debe aparecer la versión remota **procesada**; no confundas «Realtime conectado» con entrega de datos.
5. Descarga **un informe V20.1.2 de cada dispositivo**. En el PC utiliza «Comparar con informe del otro dispositivo» y selecciona el informe del móvil. Los sellos de versión deben corresponder. **Esto no prueba identidad de contenido: confirma también el rally real.**
6. Repite la operación en sentido inverso, del móvil al PC, con una segunda modificación.
7. Sin conexión, edita un tercer rally de prueba, vuelve a conectar y comprueba que el cambio permanece pendiente hasta el acuse y aparece una sola vez en el otro dispositivo.
8. Para comprobar el bloqueo de concurrencia, realiza cambios incompatibles sobre la **misma acción de un partido desechable** en dos dispositivos. El resultado esperado es bloqueo o resolución explícita; **nunca sobrescritura silenciosa**.

Si hay diferencias, cambios pendientes, conflictos o un informe imposible de comparar, conserva ambos JSON y los diagnósticos antes de intentar una restauración.

## Qué significa cada estado

- **Versión vista:** identificador temporal que Supabase devolvió en una lectura correcta.
- **Versión procesada:** identificador entregado al aplicador local; debe comprobarse el contenido visible en el scouting.
- **Versión subida:** identificador devuelto por el servidor tras una escritura CAS aceptada.
- **Diario pendiente:** copias locales no retiradas por confirmación. Cualquier pendiente impide confirmar que el dispositivo está completamente al día.

Los informes no contienen IDs de cuentas o dispositivos, nombres de jugadores, scoutings, tokens ni vídeos. Por privacidad, antes de compararlos debes comprobar **manualmente** que ambos usan la misma cuenta.

## Reversión

Si aparece un problema, detén la edición, descarga ambos JSON y los lotes pendientes y restaura el commit anterior de GitHub. **No borres la caché de datos del sitio, IndexedDB ni los archivos locales para intentar resolver un conflicto.** Restaurar archivos de GitHub no restaura automáticamente el contenido del navegador.

## Alcance de esta entrega

V20.1.2 corrige la lectura marcada como exitosa tras un error, bloquea la falsa recepción cuando el aplicador remoto falta o falla y añade diagnóstico y pruebas simuladas de dos clientes CAS. No reemplaza Supabase, no crea un segundo escritor, no mueve vídeos y no ofrece todavía operaciones de servidor independientes por contacto. **Se requieren pruebas físicas con tu Supabase real para validar producción.**
