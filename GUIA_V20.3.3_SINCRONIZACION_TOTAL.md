# Volley Coach V20.3.3 · Sincronización completa de datos

Esta entrega refuerza la sincronización automática de los **datos persistentes** de Volley Coach. No cambia las credenciales, las tablas de Supabase ni crea un segundo escritor. El mismo motor de guardado seguro (`v962`, comprobación de versión CAS) continúa siendo la autoridad.

## Qué se ha mejorado

1. **Detección común de cambios:** si una pantalla guarda datos localmente pero no avisa a la nube, el módulo `225` detecta el cambio y lo pone en la cola protegida.
2. **Entrega más rápida:** las ediciones se agrupan en ventanas cortas (aproximadamente 350–650 ms de espera tras el último cambio; con límites internos para evitar esperar indefinidamente mientras se escribe). Son tiempos de programación, **no una garantía de recepción**.
3. **Actualización de otros dispositivos:** después de una escritura confirmada, el canal Realtime avisa a los demás, que leen el estado de la nube, verifican la versión y actualizan la pantalla activa. Hay también sondeo de respaldo y comprobación al volver a abrir la aplicación.
4. **Control de concurrencia:** las revisiones locales evitan confirmar una versión anterior si la persona ha hecho otro cambio mientras se enviaba la primera. La fusión por registros cubre también semanas de temporada, objetivos, plantillas, planes de partido y perfiles de rivales.
5. **Conflictos y copias:** dos cambios incompatibles en el mismo dato necesitan revisión. Las copias protegidas, el diario local y la resolución de conflictos siguen disponibles.
6. **Indicador global:** el encabezado informa del estado de la nube y muestra cuántos dispositivos están presentes cuando el canal confirma su presencia.

### Datos que se transmiten

- Partidos (calendario, resultados, detalles y evaluaciones).
- Scoutings y acciones/rallies guardados; puntuaciones y sets registrados.
- Entrenamientos en planificación e historial; asistencia y participantes guardados.
- Jugadores, plantillas, planificación de temporada y objetivos.
- Planes de partido, alineaciones guardadas y perfiles de rivales.
- Otros campos persistidos en el estado del club, sujeto a las reglas de resolución de conflictos.

**No se transmite:** el vídeo pesado almacenado solamente en el dispositivo, archivos privados de IndexedDB, cámara/REC en directo, posición del ratón, cursor o navegación individual. Esos elementos requerirían un servicio específico de archivos o de presencia colaborativa.

## Instalar sin perder datos

1. **Antes de actualizar**, en cada dispositivo abre la aplicación y usa **Descargar JSON de este dispositivo** en Conexión nube; guarda ambos archivos en un lugar seguro. Si aparece un conflicto, conserva los dos JSON y no elijas una versión sin compararlos.
2. Para actualizar un repositorio existente de **V20.3.2.1**, descarga `Volley_Coach_V20.3.3_SOLO_CAMBIOS.zip` y sube su contenido **en la raíz** de GitHub, respetando los nombres y sustituyendo los archivos homónimos. No subas el ZIP cerrado como si fuera la página.
3. Si hay dudas sobre archivos omitidos en versiones anteriores, utiliza `Volley_Coach_V20.3.3_SUBIR_GITHUB_COMPLETO.zip` y publica su contenido completo. Comprueba que GitHub Pages termina de desplegar todos los módulos.
4. Abre la aplicación en el portátil y en el móvil, actualiza la página en ambos y comprueba que usan la misma cuenta. Si el navegador mantiene una versión anterior, cierra la pestaña y vuelve a abrirla; verifica que no aparezca un aviso de JavaScript faltante.

## Prueba real, en dos dispositivos

En ambos, con la misma cuenta y conexión estable:

1. Crea un partido de **prueba** en el portátil: debe aparecer en el móvil con el mismo rival y fecha.
2. Cambia su resultado en el móvil: debe verse en el portátil, sin sumar puntos de forma duplicada.
3. Crea un entrenamiento de prueba en el móvil: debe aparecer en el portátil; modifica un dato y comprueba el regreso.
4. En un scouting de prueba, añade un rally desde un dispositivo y comprueba en el otro el marcador y el rally; después, deshazlo y vuelve a comprobar.
5. Realiza una edición en un apartado distinto desde cada dispositivo con pocos segundos de diferencia (por ejemplo, partido y objetivo de temporada); ambas deben conservarse.
6. Pon un dispositivo sin conexión, edita un registro de prueba y reconecta. Debe quedar pendiente hasta que la nube confirme su recepción. Si hay conflicto, **resuélvelo expresamente**: no se decidirá por la fecha.
7. Comprueba que se mantiene el indicador de dispositivos conectados. Si el canal Realtime no conecta, el sondeo de respaldo puede tardar más en actualizar.

No borres las copias JSON hasta haber completado estas comprobaciones con datos de prueba. **Las pruebas automatizadas con Supabase simulado no equivalen a una validación con tu cuenta y tus dos dispositivos reales.**

## Archivos esenciales modificados

- `index.html`: coordinación del guardado, aplicación remota, carga y versiones.
- `service-worker.js`: actualización de caché y nuevo módulo.
- `083-v138-realtime-mobile-runtime.js`: aviso Realtime seguro y recepción de versiones confirmadas.
- `171-vc1910-data-reliability.js` y `173-vc1915-conflicts-recovery.js`: fusión conservadora de más colecciones.
- `225-vc2033-complete-live-sync.js`: detección común de cambios y actualización visual.

Los ZIP «solo cambios» y «completo» incluyen también las dependencias de migración y diagnóstico ya usadas en V20.3.2.1. No es necesario ejecutar una nueva migración SQL para esta actualización; la migración controlada anterior sigue siendo una herramienta de comprobación, no un requisito para cada arranque.
