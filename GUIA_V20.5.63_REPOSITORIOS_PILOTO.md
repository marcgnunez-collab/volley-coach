# Volley Coach V20.5.63 · Repositorios piloto IndexedDB

**Base: V20.5.62.** Esta fase crea una prueba local y reversible de la separación del club en repositorios. **La aplicación todavía NO utiliza estas colecciones como almacenamiento principal.**

## Qué se ha implementado

En **Gestión → Repositorios locales de prueba** aparecen dos botones:

1. **Crear y comprobar réplica local:** solo si lo pulsas, se abre una base independiente llamada `VolleyCoachClubPartitionsV2063` y se realiza una escritura atómica de las colecciones `players`, `trainings`, `seasons` y un metarregistro. A continuación se lee todo y se comprueban exactamente los datos almacenados.
2. **Eliminar réplica piloto:** después de una confirmación, elimina exclusivamente la base piloto. No toca jugadores, entrenamientos, scouting, copias JSON ni nube del sistema en producción.

Cada registro de estas primeras colecciones corresponde a un **equipo**, no a un jugador o entrenamiento individual. La migración de entidades individuales e incremental sigue pendiente.

La réplica contiene:

| Colección | Campos existentes del equipo | Excluye |
| --- | --- | --- |
| `players` | `jugadores` | Código de scouting y vídeo |
| `trainings` | `sesionActual`, `meta`, `historial`, `planificacion`, `plantillas` | Partidos completos |
| `seasons` | `temporada`, `temporadas`, `temporadaActual`, `season`, `seasonName` solo si ya existen | Temporadas inventadas o inferidas |

La temporada puede estar dentro de `meta` o de módulos históricos no unificados; en este piloto no se presenta como dato separado si no existe explícitamente. La colección de entrenamiento conserva `meta` sin modificarlo.

## Seguridad y límites

- El botón está desactivado si el módulo o IndexedDB no están disponibles.
- El nuevo repositorio se utiliza **únicamente bajo acción manual**. Nunca se abre automáticamente al cargar, registrar puntos, deshacer o sincronizar.
- No se modifican la clave `volleyCoachStateV43`, la copia independiente `volleyCoachLibraryV1` ni el diario `VolleyCoachScoutJournalV902`.
- Una sola transacción guarda tres colecciones y metadatos. Una lectura posterior verifica todas las filas antes de mostrar «verificado».
- Si el club cambia durante la comprobación, el mensaje advierte de que la réplica puede haber quedado desactualizada.
- Se limita la prueba a 100 equipos y 5 millones de caracteres serializados. No se recopilan contraseñas ni se envían contenidos a servidores.
- **La réplica puede contener nombres y otros datos personales**. Bórrala con el botón cuando termines la prueba.

## Instalación en GitHub

1. Exporta una copia JSON de seguridad del club y conserva la V20.5.62.
2. Si ya tienes la V20.5.62, descarga `Volley_Coach_V20.5.63_SOLO_CAMBIOS.zip`, descomprímelo y sube **todos los archivos de dentro** a la raíz de GitHub manteniendo su estructura. Reemplaza los archivos con el mismo nombre, pero no elimines los demás.
3. Para recuperar todo el código fuente, usa `Volley_Coach_V20.5.63_COMPLETO.zip`.
4. Si la publicación es estática y no compila Vite, utiliza el contenido de `Volley_Coach_V20.5.63_PUBLICACION_VITE.zip` sin mezclar compilados anteriores.
5. Espera a que se actualice el *service worker* y recarga la aplicación.

## Cómo probarlo

- Crea un club o utiliza un **equipo de prueba**, con jugador, entrenamiento y temporada.
- Abre Gestión y pulsa «Crear y comprobar réplica local». Espera al resultado verificado y revisa los recuentos.
- Cambia un jugador o entrenamiento y vuelve a pulsar el botón: la nueva réplica se coteja con el estado actual.
- Comprueba que el trabajo habitual en Scouting y la sincronización no ha cambiado.
- Finalmente pulsa «Eliminar réplica piloto» y confirma. Los datos originales deben seguir intactos.

## Qué NO demuestra esta versión

Los tests comprueban la estructura, los casos de error y el orden de transacciones con una simulación de IndexedDB. Sigue pendiente probar la recuperación tras cerrar bruscamente el navegador, cuotas y bloqueo entre varias pestañas, recepción real PC/móvil y el paso de una colección por equipo a escrituras incrementales por entidad. **No borres tus datos existentes ni cambies a esta réplica como fuente principal.**

## Siguiente fase propuesta

**V20.5.64:** ensayar persistencia por entidad con IDs estables, cambios parciales y reconciliación controlada; completar pruebas reales de recuperación antes de activar la nueva ruta de guardado.
