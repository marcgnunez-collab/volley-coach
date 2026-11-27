# Volley Coach V20.6.4 — Verificación integral y estado real de módulos

## Qué incorpora

Un diagnóstico de solo lectura desarrollado en TypeScript (`src/state/runtime-health.ts`, `src/state/runtime-health-runtime.ts`) que consulta el estado observable de la aplicación sin modificarlo.

Se encuentra en **Gestión → V20.6.4 · Estabilidad y diagnóstico → Comprobar estabilidad de la aplicación**. El botón no realiza conexiones, no descarga ni sube datos, no escribe en el diario local y no inicia ninguna grabación.

Comprueba:

1. **Arranque Vite:** si el coordinador V20.6.3 está listo, pendiente o falló.
2. **Scouting:** si existe un partido activo y si los lectores originales de partido y set señalan las mismas referencias. No intenta cambiar el partido seleccionado.
3. **Vídeo:** si el módulo de vídeo está disponible y, cuando existe información, si Live Delay indica grabación/reproducción en curso. La disponibilidad del módulo **no prueba** que la cámara funcione.
4. **Nube:** distingue `cloudConnected` y el estado de suscripción Realtime; solo indica conexión efectiva cuando ambos son verdaderos. Muestra el número de otros dispositivos informado por la capa de presencia **únicamente mientras Realtime esté conectado**; al desconectarse oculta cifras antiguas, sin inventar conexiones.
5. **Diario durable:** comprueba únicamente si el inspector existe, sin leer el contenido de IndexedDB ni acceder a cuentas.

Los datos del informe omiten identificadores de cuenta, equipos, jugadores, partidos, acciones, tanteos y fuentes de vídeo. Se puede consultar también desde la consola:

```js
window.VC_RUNTIME_HEALTH_2064?.inspect()
```

El informe es instantáneo; repite la consulta para comprobar si cambia el estado de nube. **No es una prueba certificada de sincronización entre dos dispositivos.**

## Garantías de esta fase

- Se conserva el único escritor nativo de acciones, puntos y Deshacer.
- No se modifica la lógica de REC/Delay, videoteca ni clips.
- No se realizan operaciones nuevas de lectura/escritura en IndexedDB, localStorage o Supabase.
- No se vuelve a conectar un dispositivo ni se refresca presencia al pulsar el botón.
- La ausencia de un partido activo no se presenta como corrupción. La desconexión de nube se indica sin declararla un fallo del motor.
- Una discrepancia de referencias produce un aviso y **nunca una corrección automática**.

## Actualización en GitHub

**Si has ido aplicando `SOLO_CAMBIOS` y la aplicación funciona, continúa exactamente igual. No tienes que subir `PUBLICACION_VITE` por primera vez.**

- `Volley_Coach_V20.6.4_SOLO_CAMBIOS.zip`: aplicar solo sobre V20.6.3, subiendo los archivos y respetando sus rutas.
- `Volley_Coach_V20.6.4_COMPLETO.zip`: copia completa del proyecto fuente.
- `Volley_Coach_V20.6.4_PUBLICACION_VITE.zip`: alternativa para despliegue íntegro de la distribución compilada si se decide cambiar de sistema de publicación. No mezclar con la actualización incremental habitual.

No borrar datos, archivos históricos ni cambiar la configuración de Pages para aplicar esta actualización.

## Validación pendiente

Las pruebas automatizadas de código, lecturas, arranque, sincronización observable y metadatos de vídeo no sustituyen un navegador real ni una sesión con dos dispositivos conectados. El ejecutable Chromium del entorno sigue sin estar disponible. Para cerrar definitivamente la reestructuración, aún deben realizarse pruebas manuales de Scouting, Punto/Deshacer, REC/Delay, reanudación offline, recuperación y nube en el GitHub publicado.
