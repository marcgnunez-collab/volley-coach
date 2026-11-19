# Volley Coach V20.5.20 · Validación real en GitHub y doble dispositivo

## Objetivo y alcance

Esta fase añade una **verificación reproducible** para la recuperación del Scouting sin sustituir el motor nativo del partido ni crear otro escritor a IndexedDB o Supabase.

La versión incluye:

1. `.github/workflows/volley-coach-recovery.yml`: un workflow de GitHub Actions que se ejecuta tras publicar los archivos modificados o mediante `Run workflow`.
2. Mejoras de `test-audit/vc20519-browser-recovery.test.cjs`: en modo CI la prueba de Chromium es **obligatoria**. No se declara un resultado verde cuando Chrome está ausente, bloqueado por permisos o no ha podido comprobar IndexedDB.
3. Tres escenarios adicionales en `test-audit/v2012-multi-device-validation.test.cjs`: utilizan **el código CAS original** extraído de `index.html`, el diario V20.1.1 original y el inspector de recuperación V20.5.19.
4. `vc20520-ci-recovery.test.cjs`: comprueba que el workflow exige el navegador, que no utiliza credenciales y que no se monta un segundo escritor.

**No se modifica el Scouting real.** El piloto transaccional y su bloqueo siguen sin instalarse en los botones, el teclado o la sincronización de producción.

## Pruebas de dos dispositivos

| Escenario | Resultado verificado |
| --- | --- |
| A tiene una copia previa pendiente | El inspector devuelve `checkpoint-before`, pero no lo considera una subida confirmada. |
| A confirma la subida y B procesa el mismo CAS | Solo A escribe en la nube simulada; B recibe el scouting actualizado y la marca CAS correspondiente. |
| B tiene una edición divergente y su borrador ya se guardó | El CAS evita sobrescribir silenciosamente a A. B conserva la edición y el checkpoint pendiente; la comparación pide revisión. |
| El conflicto ocurre antes de confirmar un borrador de B | El inspector devuelve `no-checkpoint`. El sistema **no inventa** una copia recuperable; B continúa marcado como modificado. |

Estas pruebas utilizan un **servidor CAS simulado**, con el motor real de sincronización y diario. No son dos cuentas Supabase auténticas ni dos teléfonos conectados a internet.

## Resultados de esta entrega

- **150 pruebas actuales**: TypeScript, Vite, reglas de voleibol, Scouting, pruebas nativas, recuperación y validación del workflow.
- **42 pruebas históricas y de integración**: CAS, diario, compatibilidad y doble dispositivo simulado.
- **192 pruebas superadas** en total.
- Auditoría estructural: **0 archivos referenciados ausentes y 0 importaciones de scripts duplicadas**.
- **Prueba de navegador Chromium real: todavía NO superada.** En este entorno, Chrome no puede abrir un socket (`Operation not permitted / EPERM`).

Hemos comprobado además que con `VC_BROWSER_REQUIRED=1` esta restricción **produce un fallo real del comando**, no una omisión aceptada. GitHub Actions usa ese modo obligatorio.

## Qué hará GitHub Actions al subir V20.5.20

El workflow **Volley Coach · Recuperación y navegador real**:

1. Descarga el repositorio.
2. Instala Node.js y dependencias según `package-lock.json`.
3. Ejecuta compilación TypeScript, Vite y pruebas actuales.
4. Ejecuta 42 pruebas históricas de CAS, diario y doble dispositivo.
5. Comprueba que Chrome/Chromium exista en el runner.
6. Ejecuta el ensayo de **IndexedDB real** en Chromium: crea un checkpoint, mata el navegador, inicia un segundo proceso y comprueba que el diario conserva la copia y bloquea descargas peligrosas.

El workflow usa permiso **solo lectura** sobre el repositorio y no necesita claves de Supabase, cuentas personales ni archivos de tus jugadores.

### Cómo comprobar el resultado

1. Abre https://github.com/marcgnunez-collab/volley-coach.
2. Entra en **Actions**.
3. Selecciona **Volley Coach · Recuperación y navegador real**.
4. Abre la ejecución del commit de V20.5.20.
5. Comprueba si el trabajo `foundation-and-browser` aparece en verde o rojo.

- **Verde:** el ensayo automatizado pudo ejecutar el navegador real en GitHub y todos sus controles pasaron.
- **Rojo:** revisa qué paso falló y conserva esa evidencia; **no** actives el piloto en los partidos.
- **Sin ejecución:** en **Actions**, selecciona el workflow y pulsa **Run workflow** desde la rama principal. Si la opción no aparece, comprueba que el YAML se ha publicado en `.github/workflows/`.

**Importante:** a fecha de esta entrega **no hemos ejecutado el workflow en tu GitHub**, porque los archivos están preparados para que los subas. Por tanto, **todavía no hay una validación real de Chromium confirmada**.

## Instalar V20.5.20

Si ya tienes **V20.5.19**, utiliza `Volley_Coach_V20.5.20_SOLO_CAMBIOS.zip`:

1. Descarga y descomprime.
2. Copia el contenido a la **raíz de GitHub**, conservando la carpeta oculta `.github/workflows/` y `test-audit/`.
3. Confirma la incorporación de `.github/workflows/volley-coach-recovery.yml` y `vc20520-ci-recovery.test.cjs`.
4. Actualiza `test-audit/v2012-multi-device-validation.test.cjs`, `test-audit/vc20519-browser-recovery.test.cjs`, `README.md`, `package.json`, `package-lock.json`, `index.html`, `service-worker.js` y las pruebas de versión incluidas.
5. Confirma el commit y abre **Actions** para revisar la nueva ejecución.

**No borres** el diario `210-vc2011-durable-sync-journal.js`, el CAS original, los módulos V20.5.12 `233`/`234`, los scripts numerados, el vídeo o la nube.

El ZIP `COMPLETO` incluye toda la fuente y pruebas; `PUBLICACION_VITE` contiene la salida `dist/` para el alojamiento estático, **sin** los archivos de desarrollo del workflow.

## Próximo paso, una vez que el trabajo esté verde

Validar en **portátil y móvil reales** con una cuenta de pruebas:

1. Registrar un rally en A y comprobar marcador, rotación y vídeo en ambos dispositivos.
2. Deshacer el rally en A y verificar que B lo recibe sin duplicados.
3. Desconectar B y registrar un cambio local; reconectar y comprobar el conflicto protegido.
4. Forzar una recarga tras una copia pendiente y comprobar que el diario sigue disponible.
5. Cerrar un set, cambiar de rotación y revisar el informe V20.1.2 en ambos dispositivos.

La estructura completa hacia Vite + TypeScript continúa: el siguiente paso de producto sería un panel manual de recuperación en Gestión, basado en estas evidencias y todavía sin aplicar restauraciones automáticas.
