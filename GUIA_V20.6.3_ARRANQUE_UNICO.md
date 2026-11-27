# Volley Coach V20.6.3 — Arranque único y protección contra módulos duplicados

## Cuarto bloque de la gran reestructuración

El módulo TypeScript/Vite solía ejecutar decenas de funciones de instalación directamente y registrar el montaje de 17 paneles con su propia condición `DOMContentLoaded`. Ese recorrido se ha colocado dentro de un coordinador pequeño, explícito y comprobable: `src/state/bootstrap-coordinator.ts`.

**No sustituye ningún motor nativo.** El coordinador solo decide cuándo ejecutar la misma secuencia histórica de inicialización.

### Secuencia conservada

1. Registrar una única instancia por ventana: `VC_APP_BOOTSTRAP_2063`.
2. Instalar una sola vez, en su **orden original**, los puentes de Scouting, análisis, puntuación, preparación de acciones, vídeo, recuperación, IndexedDB y diagnóstico de nube.
3. Si el documento aún está cargando, esperar a `DOMContentLoaded` con **un único listener**; si ya está listo, continuar inmediatamente.
4. Montar los 17 paneles TypeScript una sola vez y en su orden original.
5. Exponer un estado de diagnóstico de solo consulta (`created`, `installing`, `waiting`, `mounting`, `ready`, `failed`).

### Por qué es importante

- Una segunda carga del mismo paquete reutiliza el coordinador anterior, incluso si los módulos proceden de dos URL diferentes.
- Una llamada repetida o reentrante no vuelve a instalar adaptadores que podrían envolver por segunda vez los botones de Punto o Deshacer.
- Un error después de un inicio parcial deja el estado en `failed` y bloquea intentos automáticos potencialmente peligrosos; no vuelve a ejecutar comandos nativos.
- El coordinador no lee ni modifica datos personales de partidos, puntuación, REC/Delay, clips, localStorage, IndexedDB ni CAS/Supabase.

### Diagnóstico

En la consola de navegador, con la aplicación cargada:

```js
window.VC_APP_BOOTSTRAP_2063?.diagnostics()
```

En condiciones normales, después de abrir la aplicación debe mostrar `phase: "ready"`, `bridgeRuns: 1`, `mountRuns: 1` y `failures: 0`. Si el estado es `failed`, no se debe reintentar manualmente la inicialización; conserva los datos locales y revisa el error antes de publicar otra versión.

### ZIP y GitHub

- **SOLO_CAMBIOS:** incremental estrictamente desde V20.6.2. Aplicarlo sobre el repositorio fuente V20.6.2 y reconstruir la web con Vite.
- **COMPLETO:** el proyecto fuente V20.6.3, documentación y pruebas.
- **PUBLICACION_VITE:** distribución compilada. Subir su contenido completo, sin carpeta adicional, a la raíz publicada en GitHub Pages; sobrescribir los archivos correspondientes sin borrar datos de usuarios.
- **Reversión:** volver a publicar V20.6.2 si se observa un problema, sin restaurar ni reescribir los partidos locales.

### Pruebas y límite

La batería incluye comprobaciones de arranque inmediato/diferido, reentrada, importación doble, errores parciales, diagnóstico inmutable, orden de instaladores y montaje de paneles. La compilación TypeScript/Vite y las regresiones históricas también deben pasar.

En este entorno el comando `chromium --version` falla por falta del binario de navegador; **no es posible certificar aquí una prueba real de interfaz en Chromium**. También quedan pendientes la prueba con dispositivos reales, REC/Delay físico, sincronización Supabase y el retiro de las implementaciones anteriores tras estabilización.
