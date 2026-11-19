# Volley Coach V20.5.28 · Optimización visual de Scouting y Análisis

**Base para actualizar:** V20.5.27. Esta entrega no modifica el registro de puntos ni sus datos.

## Qué cambia

- Scouting LIVE y el boxscore de jugadores solo vuelven a pintar cuando cambia su informe. Un refresco manual sí fuerza la actualización. Se comprueba también cada cinco segundos como máximo cuando llega un nuevo evento, por seguridad.
- Data Engine y Rally Search conservan los nodos y filtros cuando la vista calculada es idéntica; al cambiar de pestaña verifican los elementos existentes antes de reutilizarlos.
- Gestión → Rendimiento → **Actualizaciones visuales de Scouting y Análisis** muestra cuatro contadores de repintados, repeticiones evitadas, duración media y errores. **Actualizar medición** relee los números; no se envía telemetría externa.
- Las mediciones son orientativas: «repeticiones evitadas» solo cuenta llamadas detectadas como iguales y la duración mide la operación concreta, no la latencia total del partido.

## Publicación en GitHub Pages

### Si ya tienes V20.5.27

Descomprime `Volley_Coach_V20.5.28_SOLO_CAMBIOS.zip` sobre la **raíz** del repositorio, conservando rutas y sustituyendo archivos existentes. Publica y espera a que termine GitHub Pages. La primera apertura tras el despliegue puede requerir recargar por el service worker.

### Instalación completa sin compilar

Descomprime `Volley_Coach_V20.5.28_COMPLETO.zip` en la raíz. Incluye fuentes, dependencias declaradas, pruebas y archivos históricos necesarios para los modos nativos.

### Publicación del resultado de Vite

Sube **el contenido** de `Volley_Coach_V20.5.28_PUBLICACION_VITE.zip` a la raíz del sitio que se sirve. Es una construcción distribuible; no es el proyecto fuente.

**No mezcles los tres ZIP entre sí.** Para actualizar el GitHub existente se recomienda `SOLO_CAMBIOS`, siempre que la base sea V20.5.27.

## Validación después de subir

1. Comprueba que Gestión → Rendimiento muestra el apartado de «Actualizaciones visuales de Scouting y Análisis».
2. En Scouting LIVE, registra, corrige y deshaz una acción; comprueba que el análisis cambia y el tanteo original se mantiene coherente.
3. En Analizar, cambia de equipo, set y rotación: el boxscore debe reflejar los filtros.
4. Alterna entre Data Engine y Búsqueda táctica; sus controles deben conservar el funcionamiento y los resultados adecuados.
5. En Gestión pulsa **Actualizar medición** para comprobar las actualizaciones y los repintados evitados.

La suite automática cubre firmas repetidas, caducidad, errores de render, correcciones, deshacer y convivencia con las vistas históricas. Las pruebas no sustituyen un partido real con vídeo, desconexión y otro dispositivo.
