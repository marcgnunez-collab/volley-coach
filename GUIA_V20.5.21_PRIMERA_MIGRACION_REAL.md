# Volley Coach V20.5.21 · Primera migración real a TypeScript/Vite

## Qué cambia

El panel de **validación PC + móvil** que aparece en la ventana de sincronización ya no ejecuta el archivo clásico `211-vc2012-multi-device-validation.js`. Su lógica de informes, comparaciones y montaje de interfaz vive ahora en:

- `src/domain/multi-device-validation.ts`: funciones puras tipadas, equivalentes al comportamiento anterior.
- `src/domain/multi-device-runtime.ts`: montaje de interfaz y API pública compatible `window.VC_SYNC_2012`.
- `src/vc2055-entry.ts`: instala el módulo en el bundle único Vite `vc2055-domain-core.mjs`.

Se conserva el CSS y los identificadores de pantalla. El antiguo `211` permanece como **referencia de regresión** y recurso publicado; no se carga por `index.html`. **No se ha migrado el motor de puntos ni el escritor CAS**. No se debe borrar ningún script clásico adicional todavía.

## Instalar desde GitHub

Si ya tienes V20.5.20, abre `Volley_Coach_V20.5.21_SOLO_CAMBIOS.zip`, sube todos sus archivos a la raíz del repositorio [volley-coach](https://github.com/marcgnunez-collab/volley-coach) manteniendo sus carpetas y confirma los cambios. **No borres** `211-vc2012-multi-device-validation.js` ni otros archivos antiguos. Para una instalación completa nueva, utiliza el ZIP COMPLETO. El ZIP PUBLICACION_VITE es la salida optimizada y **no** sustituye al código fuente del repositorio.

En un ordenador con Node instalado ejecuta `npm ci`, `npm run test:foundation`, y `npm run build`. En GitHub comprueba que las acciones CI pasan. Tras publicar, actualiza la página sin caché (Ctrl+F5) y verifica que Gestión → Nube → diagnóstico de validación de dos dispositivos ofrece las mismas cuatro marcas de estado, descarga e importación JSON.

## Comprobación real obligatoria (no automatizada aquí)

1. Abre un partido de prueba en PC y móvil con la misma cuenta.
2. Registra una acción inocua de prueba y sincroniza en PC.
3. Confirma en el móvil que el cambio llegó realmente, además del estado de conexión.
4. Descarga y compara los dos informes de validación.
5. Comprueba sin red que el scouting sigue aceptando entradas y que la sincronización posterior no duplica puntos ni elimina cambios.

Las pruebas de equivalencia automatizadas validan el módulo, pero **no sustituyen** esta comprobación física ni garantizan funcionamiento offline total.

## Siguiente migración

Migrar por estratos los paneles de solo lectura y sus analizadores a TypeScript, medir tamaños y tiempos de actualización, mantener un único escritor de eventos de partido, y solo después abordar el motor de registro con pruebas de reglas, reversión y recuperación multi-dispositivo.
