# Volley Coach V20.5.72 — Entrenamientos en paralelo

## Qué cambia

Se incorpora una **segunda réplica opcional, exclusivamente local y no autoritativa**
para datos de entrenamiento. Es independiente de la réplica de jugadores V20.5.67
y del repositorio piloto V20.5.63.

Incluye por equipo las colecciones `sesionActual`, `historial`, `planificacion`,
`plantillas` y el campo `meta` cuando existe. Cada sesión/plan/historial/plantilla
debe tener un `id`, `uuid` o `_id` propio y único **dentro de su colección**.
No genera IDs para registros históricos y no copia partidos, scouting, vídeo,
biblioteca ni campos de temporada.

El módulo trabaja sobre el **JSON original ya guardado correctamente** en
`volleyCoachStateV43`, compatible con el formato normal o compacto. Escribe los
cambios por entidad en la base IndexedDB aislada
`VolleyCoachTrainingShadowV2072`; al terminar compara el manifiesto, todos los
registros, las claves existentes, su orden y los campos presentes.

## Cómo probarlo sin poner en riesgo el club

1. En **Gestión → Recuperación**, descarga una copia JSON completa del club.
   Consérvala en un lugar distinto del navegador.
2. Abre **Gestión → Arquitectura → Repositorios locales de prueba**.
3. En **V20.5.72 · Entrenamientos en paralelo**, pulsa
   **«Activar copia de entrenamientos»** y confirma la activación para la sesión.
4. Si hay registros antiguos sin ID o con IDs duplicados, el sistema no crea la
   réplica: avisa del número pendiente. No se asignan IDs automáticamente.
5. Con la réplica activa, guarda un entrenamiento o plan con normalidad.
   Comprueba el estado bajo los botones, o pulsa **«Comprobar entrenamientos»**.
6. Puedes pulsar **«Detener copia»**; la siguiente apertura tendrá de nuevo la
   réplica apagada. Para eliminar únicamente esta base de ensayo, utiliza
   **«Eliminar solo esta copia»**.

## Protecciones

- Activa solo por consentimiento. No cambia la fuente de verdad ni añade un
  segundo escritor al club principal.
- Web Locks impide dos escritores simultáneos del mismo repositorio entre
  pestañas. Si otra pestaña modifica el club, la copia se detiene.
- Un fallo de IndexedDB o un registro incompatible detiene el ensayo, sin
  reintentos de escrituras principales ni modificación del motor CAS/Supabase.
- La comprobación abre una nueva conexión en modo de solo lectura; no crea una
  base ausente. La eliminación está protegida y afecta solo a la base nueva.
- La copia de jugadores, el diario de scouting, vídeo, grabación, Delay y los
  archivos de entrenamiento existentes siguen usando sus rutas anteriores.

## Qué queda pendiente

La réplica no sustituye `localStorage` ni restaura el club automáticamente.
Todavía faltan la exportación/reconstrucción verificada de entrenamientos, las
pruebas reales de cierre forzado, la cobertura de registros históricos sin
identidad estable y la validación de sincronización en móvil y ordenador antes
de estudiar un cambio de almacenamiento principal.

## Instalar en GitHub

- **SOLO_CAMBIOS:** descomprime el ZIP y sube **todo su contenido** a la raíz
  del repositorio GitHub, respetando la carpeta `src/state`. Sustituye los
  archivos homónimos; agrega los nuevos. **No borres los demás**.
- **COMPLETO:** copia íntegra de referencia, para archivo o recuperación.
- **PUBLICACION_VITE:** contiene los archivos estáticos ya compilados para un
  hosting; no los mezcles con el ZIP de código fuente al hacer un mismo commit.

Si compilas desde el repositorio: `npm ci`, `npm run test:foundation` y
`npm run build`. No hagas la actualización mientras tengas un partido en
scouting, una grabación activa o cambios pendientes de sincronizar.
