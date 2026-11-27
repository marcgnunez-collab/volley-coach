# Volley Coach V20.6.5 · Lectura única de rallies

## Qué cambia

Se ha eliminado el montaje de un segundo historial completo solo para validar las proyecciones de TypeScript en las rutas efectivas de:

- **Scouting:** el lector de todos los rallies contrasta cada referencia con los sets originales sin crear otro array plano de respaldo salvo que falle la validación.
- **Match Mode:** comprueba cada par exacto de set y rally y crea la misma salida `{s,r}` de siempre.
- **Rally Review Pro:** comprueba los doce campos históricos (ID, posición, acciones, ganador, rotación, tanteos, etc.) directamente sobre las fuentes. Si falta o sobra una propiedad, se conserva el constructor clásico.
- **Vídeo:** obtiene el último rally cerrado mediante una búsqueda de atrás hacia delante; solo usa el `flatMap` original si falla la comprobación.

La proyección original de V20.6.2 **no cambia**. No se modifica el formato de un partido, el orden de rallies ni las referencias a acciones y tiempos de vídeo. No se introducen cachés, nuevos escritores, eventos ni sincronizaciones.

## Instalación para tu método de GitHub

**Si ya has subido V20.6.4 `SOLO_CAMBIOS`:**

1. Descarga `Volley_Coach_V20.6.5_SOLO_CAMBIOS.zip`.
2. Descomprímelo y copia **su contenido** al directorio principal de tu repositorio GitHub, conservando nombres y subcarpetas (`src/`, si las hay).
3. Acepta reemplazar los archivos que coincidan y confirma el commit.
4. Recarga la app, preferiblemente cerrando las pestañas anteriores para que el service worker active la versión nueva.

**No hace falta subir `PUBLICACION_VITE`** si sigues usando siempre la serie `SOLO_CAMBIOS`: el paquete de cambios contiene el `index.html`, el service worker y los archivos compilados necesarios que cambien.

`COMPLETO` es una copia íntegra recuperable y `PUBLICACION_VITE` es una modalidad de publicación alternativa. **No mezcles** ambas modalidades en el mismo despliegue.

## Comprobaciones

1. Abre un partido con varios sets y comprueba que Scouting y Match Mode ven los mismos rallies.
2. Abre **Rally Review** y confirma orden, acciones, marcas de vídeo y marcador histórico.
3. Comprueba que el vídeo sigue seleccionando el último rally cerrado.
4. Registra un punto, deshazlo y vuelve a abrir el partido; comprueba el marcador, el número de rallies y la recuperación local.
5. Si usas dos dispositivos, verifica presencia y sincronización real con el botón de Gestión de V20.6.4. Conexión no equivale a confirmación de guardado.

## Alcance y pendientes

Las pruebas de Node prueban igualdad exacta con el comportamiento histórico y rutas de respaldo, incluido un historial de 4.000 rallies. No son una medición cronometrada de rendimiento en móviles ni reemplazan las pruebas reales de navegador, REC/Delay y Supabase con dos dispositivos.

**La migración completa todavía no ha terminado:** los escritores autoritativos, parte de la interfaz antigua y la comprobación real de persistencia tras un cierre abrupto necesitan más fases y validación en entorno real.
