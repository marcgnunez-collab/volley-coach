# V20.7.0 · Reestructuración profunda con auditoría y limpieza verificable

## 1. Qué se ha reestructurado

- **Limpieza real:** fuera de la distribución, **diez archivos raíz** obsoletos o redundantes. Los dos archivos de interfaz V20.2.3.1 no tienen referencias ejecutables y la interfaz efectiva es V20.2.4.1. Los tres iconos antiguos tienen hashes idénticos a los tres iconos canónicos que se mantienen. El antiguo módulo JavaScript de validación de dos dispositivos se conserva como fixture histórica de tests porque su sustituto TypeScript es el que se carga hoy. Cuatro suites históricas duplicadas se retiran de la raíz, conservando las versiones completas de `test-audit/`.
- **Auditoría automatizada:** `scripts/audit-runtime-assets.mjs` identifica referencias locales inexistentes de `index.html`, `recuperacion.html`, `manifest.webmanifest` y el precache del service worker. Comprueba IDs de script duplicados, precargas duplicadas y assets raíz sin referencias desde el runtime o el código TypeScript.
- **Compilación vigilada:** `npm run build` ejecuta automáticamente `npm run audit:assets`; un error en el inventario bloquea la compilación. La nueva batería de regresiones reproduce referencias ausentes y archivos huérfanos en un proyecto aislado.
- **Caché corregida:** elimina la precarga duplicada de `173-vc1915-conflicts-recovery.js`, el módulo histórico no cargado `211-vc2012-multi-device-validation.js` y la entrada inexistente `vc1936-three-pane.css`; si la red falla, CSS, JavaScript clásico y módulos ES pueden buscar el mismo archivo en la caché de **esta** versión aunque su URL tenga `?v=`. El navegador no recibe una copia antigua si el servidor contesta `404`.
- **CI completo:** GitHub Actions escucha futuros cambios en scripts de auditoría, pruebas `vc*.test.cjs`, recursos CSS, JS, PNG y manifest, además de las fuentes TypeScript.

## 2. Cómo actualizar tu GitHub sin subir VITE

Este procedimiento es exactamente para tu flujo de **SOLO_CAMBIOS**.

1. Verifica que tu GitHub contiene V20.6.5 y que la app funciona.
2. Descarga y descomprime `Volley_Coach_V20.7.0_SOLO_CAMBIOS.zip`.
3. Sube **su contenido**, manteniendo rutas originales. Confirma el commit.
4. Abre `ELIMINAR_DE_GITHUB_V20.7.0.txt` (también está dentro del ZIP) y borra **solo los diez archivos señalados**, desde GitHub. Haz un segundo commit.
5. Recarga la web y verifica el icono, la navegación del modo partido, Scouting, Vídeo, REC/Delay y la conexión.

**NO subas `PUBLICACION_VITE`** si has seguido siempre la serie `SOLO_CAMBIOS`. La distribución incremental incluye los archivos raíz correctos y la compilación Vite ya publicada en la serie anterior. `COMPLETO` sirve como recuperación; no mezcles formatos.

### Archivos para borrar

| Archivo raíz | Justificación |
| --- | --- |
| `216-vc20231-dv-layout-refinement.js` | Layout histórico V20.2.3.1 no cargado; sigue activo V20.2.4.1. |
| `vc20231-dv-layout-refinement.css` | Estilos del layout histórico no cargados. |
| `vc-app-192-v1741.png` | Misma imagen byte por byte que `icon-192.png`; el HTML ya usa el icono canónico. |
| `vc-app-512-v1741.png` | Misma imagen byte por byte que `icon-512.png`, utilizado por el manifest. |
| `vc-app-maskable-v1741.png` | Misma imagen byte por byte que `icon-maskable-512.png`, utilizado por el manifest. |
| `211-vc2012-multi-device-validation.js` | Sustituido en runtime por el módulo TypeScript; su implementación antigua se conserva en `test-audit/fixtures/`. |
| `v19320-compatibility-final-audit.test.cjs` | Prueba raíz duplicada, sustituida por `test-audit/v19320-compatibility-final-audit.test.cjs`. |
| `v2001-sync-engine-reliability.test.cjs` | Prueba raíz duplicada, sustituida por `test-audit/v2001-sync-engine-reliability.test.cjs`. |
| `v2011-durable-sync-journal.test.cjs` | Prueba raíz duplicada, sustituida por `test-audit/v2011-durable-sync-journal.test.cjs`. |
| `v2012-multi-device-validation.test.cjs` | Prueba raíz obsoleta y menos completa, sustituida por `test-audit/v2012-multi-device-validation.test.cjs`. |

La referencia `vc1936-three-pane.css` se ha quitado del service worker porque **ese archivo no existía en la distribución**. No tienes que borrar ese nombre de GitHub si no está.

## 3. Qué NO se ha borrado ni se debe borrar

- `index.html`, `service-worker.js`, `manifest.webmanifest`, iconos canónicos y el layout V20.2.4.1.
- Los ficheros `vc*.test.cjs` activos, `test-audit/` (incluida su nueva fixture), `scripts/`, `src/`, `package.json`, `package-lock.json`, configuraciones Vite y `.github/workflows/`: **se necesitan para compilar y verificar la app** aunque no se ejecuten directamente al jugar un partido.
- Motores antiguos que aún se referencian desde la app, incluso si sus nombres contienen versiones viejas. El nombre antiguo no es suficiente evidencia para borrarlos.
- Almacenamiento local del navegador, IndexedDB, vídeos guardados y configuraciones Supabase; esta migración no los toca.

## 4. Comprobación y vuelta atrás

En desarrollo, `npm run audit:assets` debe dar cero rutas rotas y cero assets huérfanos; `npm run test:foundation` ejecuta también la comprobación, TypeScript, Vite y los tests. El test del service worker comprueba que no sirve un script cacheado como respuesta a un `404` ni intercepta peticiones a Supabase.

En caso de incidencia al publicar, vuelve a subir el ZIP `COMPLETO` V20.6.5 o recupera los cinco archivos de esa versión. No borres los datos del navegador ni limpies IndexedDB para resolver una incidencia de carga.

## 5. Lo que todavía falta para terminar la gran migración

Esta limpieza es un avance estructural significativo, pero **no acredita la reescritura definitiva** de todo el código histórico. Quedan aproximadamente 77 bloques `<script>` embebidos que deben extraerse por dominios, varios lectores/escritores nativos que conviven con TypeScript, validación en Chromium real, recuperación forzosa de IndexedDB y dos dispositivos con Supabase. Esas partes requieren un ciclo de pruebas de navegador antes de sustituir los motores originales.
