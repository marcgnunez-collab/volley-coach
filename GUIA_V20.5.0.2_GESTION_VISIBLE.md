# Volley Coach V20.5.0.2 · Gestión visible sin depender de scripts

La V20.5.0.1 reorganizaba Gestión mediante JavaScript. Si el módulo no llegaba a ejecutarse, se mantenían las tarjetas antiguas. La V20.5.0.2 coloca la nueva estructura directamente en `index.html` y utiliza el módulo `230` únicamente para activar la comprobación de archivos.

## Qué debe verse

Al entrar en **Gestión**:

1. Encabezado «Gestión del entorno».
2. Panel visible «Integridad de instalación» y botón **Comprobar archivos**.
3. Organización deportiva: Plantilla y jugadores, Partidos, Temporada, Plan de partido; la tarjeta Scoutings histórica se añade aquí como antes.
4. Nube y protección de datos: Recuperación, Nube, Diagnóstico nube.
5. Auditorías y mantenimiento: Rendimiento, Auditoría de scoutings, Auditoría funcional V17 y acceso directo a Integridad.

Los botones existentes conservan sus `onclick`, IDs y rutas. No se modifican scoutings, datos locales, CAS, IndexedDB, Supabase ni controles de vídeo. El diagnóstico solo solicita recursos estáticos al pulsar su botón.

## Actualizar GitHub

Descarga `Volley_Coach_V20.5.0.2_SOLO_CAMBIOS.zip`, descomprímelo y sube los archivos sueltos a la **raíz del repositorio**, sustituyendo los cuatro homónimos:

- `index.html`
- `service-worker.js`
- `230-vc2050-release-health.js`
- `vc2050-release-health.css`

Se incluyen también la prueba `vc2050-foundation.test.cjs` y esta guía. **No elimines ningún archivo del repositorio**. Espera que GitHub Pages termine su despliegue. Cierra y vuelve a abrir la aplicación si se mantiene una copia anterior.

## Si todavía ves la Gestión antigua

Comprueba primero que el `index.html` publicado en GitHub contiene el texto `COMPROBACIÓN DEL SISTEMA · V20.5.0.2` y el identificador `vc20501-management-groups`. Si no aparece en el repositorio, los archivos aún no se han subido correctamente. Si está en GitHub pero no en la página publicada, revisa el despliegue de GitHub Actions y la caché del navegador. No borres datos ni reinstales la aplicación como primer intento.

Esta entrega no reconstruye los 11 CSS históricos ausentes en el ZIP proporcionado. Consérvalos en GitHub si existen. La pantalla publicada, la navegación real y la conexión Supabase aún deben verificarse desde tu instalación.
