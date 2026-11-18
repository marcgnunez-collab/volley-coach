# Volley Coach V20.5.0.3 · CSS Reference Recovery

## Auditoría del GitHub

Se examinó el repositorio `marcgnunez-collab/volley-coach` y su historial disponible de **739 commits**. Ninguno de los once CSS citados en la instalación V20.5.0.2 aparece en la historia de archivos versionados. Los 11 nombres seguían presentes como referencias en `index.html` y en la precarga de `service-worker.js`, generando 404.

## Qué cambia

- Se eliminan **solo las referencias** a los 11 CSS inexistentes del HTML.
- Se eliminan los mismos nombres de la lista de precarga del service worker, que ahora utiliza la clave de caché con sufijo `20.5.0.3`.
- El antiguo informe de compatibilidad `208` deja de afirmar que esos CSS faltan en el ZIP distribuido; dirige hacia la comprobación de Gestión.
- La aplicación conserva los estilos que sí están presentes, incluido el CSS de las versiones posteriores.
- No se alteran las rutinas de datos, scoring, vídeo, scouting, Supabase ni IndexedDB.

**Alcance real:** esta entrega elimina solicitudes a archivos que nunca estuvieron versionados, pero **no reconstruye posibles reglas históricas**. No debe considerarse una auditoría visual completa de las vistas de análisis o vídeo. La comprobación de Gestión debería indicar **188/188 disponibles**, salvo nuevos problemas de despliegue.

## Subir a GitHub

Descarga `Volley_Coach_V20.5.0.3_SOLO_CAMBIOS.zip`, descomprímelo y coloca su contenido en la **raíz de GitHub**, sustituyendo exactamente los archivos homónimos. Incluye:

- `index.html`
- `service-worker.js`
- `208-vc19320-compatibility-audit.js`
- `v19320-compatibility-final-audit.test.cjs`
- `230-vc2050-release-health.js`
- `vc2050-foundation.test.cjs`
- Esta guía.

No borres otros archivos del repositorio. Los CSS existentes tampoco deben sustituirse ni borrarse. La actualización es incremental y no modifica la base de datos.

## Validación posterior

1. Espera a que GitHub Pages haya terminado el despliegue.
2. Recarga la aplicación; verifica que en Gestión pone `V20.5.0.3`.
3. Pulsa **Comprobar archivos**. Deben comprobarse 188 referencias, sin ausentes, siempre que el servidor publique todos los recursos.
4. Revisa visualmente Scouting, Delay, Clips, Análisis, Rivales y la búsqueda de rallies, especialmente en móvil.
5. Comprueba con datos de prueba los flujos de scouting y sincronización con dos dispositivos. Las pruebas automatizadas no sustituyen esta validación.

En caso de anomalías visuales después de desplegar, conserva una copia del ZIP anterior V20.5.0.2 para restaurar archivos concretos y comunica la pantalla afectada. No restaures datos ni borres almacenamiento local por un problema de CSS.
