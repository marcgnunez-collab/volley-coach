# Volley Coach V20.5.36 — Preparación de acciones de Scouting

**Base necesaria:** V20.5.35. Esta entrega continúa la migración gradual a TypeScript/Vite sin reemplazar de golpe los flujos activos durante un partido.

## Qué hemos migrado

- La capa `src/domain/scout-action-preparation.ts` recibe el texto original y el partido, invoca **una sola vez** al parser nativo y devuelve un sobre con la **misma referencia** de resultado.
- El adaptador `src/domain/scout-action-preparation-runtime.ts` publica `VC_SCOUT_PREPARE_20536`, que se carga en el bundle Vite existente.
- El registrador `v857RegisterRaw` utiliza esta preparación antes de llamar a su **escritor original**. No hay un segundo escritor ni una segunda acción.
- El diagnóstico es local y de solo lectura: contadores y presencia de campos, sin guardar nombres, dorsales, códigos, URLs ni imágenes.

## Qué no cambia

- Sintaxis y reglas del parser clásico; aceptación/rechazo de comandos.
- Escritura del scouting, suma de puntos, rotaciones, deshacer y cierre de rally.
- Metadatos de jugador, fundamento, valoración, zonas, táctica y vídeo, sin convertirlos ni recortarlos.
- IndexedDB, servicio de sincronización, nube y mecanismo de recuperación.

El registrador conserva un respaldo directo al parser histórico si el puente TypeScript no existe, devuelve un resultado inválido o falla. El parser histórico se ejecuta **como máximo una vez por intento**; sus errores de negocio continúan propagándose.

## Dónde verlo

1. Abre **Scouting → Scoutar**.
2. En **Scouting Speed Pro**, busca el estado **«Preparación TypeScript · parser y escritura nativos»**.
3. Si el bundle no está listo, mostrará **«Preparación nativa (respaldo)»**. Eso no significa que no se pueda registrar, sino que se usa la ruta clásica.

## Cómo instalar

| Descarga | Cuándo utilizarla |
| --- | --- |
| `Volley_Coach_V20.5.36_SOLO_CAMBIOS.zip` | Si GitHub tiene instalada V20.5.35. Sustituye y añade los archivos respetando las rutas. |
| `Volley_Coach_V20.5.36_COMPLETO.zip` | Si necesitas reconstruir todo el repositorio. |
| `Volley_Coach_V20.5.36_PUBLICACION_VITE.zip` | Si publicas directamente los ficheros compilados de Vite. |

En GitHub sube los archivos a la **raíz del repositorio** manteniendo carpetas. Evita subir los ZIP como archivos de la web: descomprímelos antes. Tras publicar, recarga forzosamente y espera a que se actualice el Service Worker.

## Verificación recomendada antes de un partido real

1. Abrir **Gestión → Comprobación del sistema** y comprobar que no hay archivos ausentes.
2. En un **partido de prueba** registrar saque, recepción, ataque, error y bloqueo con distintos dorsales y zonas.
3. Comprobar que se genera **una única acción** y que los puntos y turnos de saque son correctos.
4. Corregir y deshacer una jugada; revisar estadísticas y enlaces de vídeo.
5. Probar sin conexión y después sincronizar en dos dispositivos de prueba.

**Alcance de las pruebas automáticas:** se comprueban la identidad de los objetos, número de llamadas, campos conservados, respaldo y errores, y la construcción TypeScript/Vite. No equivalen a una prueba completa de partido real ni certifican una entrega en la nube remota.
