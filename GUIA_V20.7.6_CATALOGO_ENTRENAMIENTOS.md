# Volley Coach V20.7.6 · Catálogo de entrenamientos independiente

## Qué cambia

El gran archivo `002-core-training-v150-monolithic.js` tenía **647.727 bytes**. Siete
declaraciones de datos literales JSON ocupaban **475.348 bytes** de su código. Ahora
esos datos se mantienen, sin modificar ni un campo, en
`vc2076-training-catalog-data.js` (**481.364 bytes**, incluidos comentarios).
El núcleo de entrenamiento baja a **167.116 bytes** (un 74,2 % menos).

**Importante:** es una separación de responsabilidades, no una reducción
equivalente del total de bytes transferidos. La aplicación carga **un archivo
adicional**; se precarga junto al núcleo y la misma caché PWA lo conserva.
Esta división permite trabajar a continuación sobre la lógica y optimizar la
carga del catálogo sin tocar el guardado.

Los siete conjuntos conservados son:

1. `defaults` (379 ejercicios).
2. `EJERCICIOS_PROPIOS_183` (158).
3. `EJERCICIOS_PROPIOS_287_NUEVOS` (215).
4. `LIMPIEZA_RECEPCION_V1` (44).
5. `LIMPIEZA_COLOCACION_V1` (22).
6. `LIMPIEZA_ATAQUE_V1` (14).
7. `LIMPIEZA_DEFENSA_BLOQUEO_V1` (14).

Se ha comprobado que la reinserción exacta de las siete declaraciones en su
posición previa reproduce el código completo anterior **byte por byte**
(SHA-256 `df5f44ca68036a8a254f5eb54ca4dbe4f29674a3e82228fa68607b061fd51814`).
El registro, la recuperación, la nube, el diario, la propiedad de los datos
y los identificadores de almacenamiento permanecen en el núcleo de ejecución
nativo. El módulo de catálogo no escribe datos ni tiene efectos de inicialización.

## Cómo instalar en GitHub

1. La base es **V20.7.5**. Descarga **V20.7.6 SOLO_CAMBIOS**.
2. Descomprime el ZIP y sube sus archivos **a la raíz del repositorio**, respetando
   las subcarpetas incluidas, como has hecho con versiones anteriores.
3. Sustituye los archivos existentes que tengan el mismo nombre y agrega
   `vc2076-training-catalog-data.js`. Comprueba que este último queda en
   la raíz junto al archivo `002-core-training-v150-monolithic.js`.
4. No subas aparte `PUBLICACION_VITE`; tu flujo habitual usa `SOLO_CAMBIOS`.
5. Deja terminar GitHub Actions y recarga la app. Si la PWA mantiene una versión
   antigua, ciérrala y ábrela de nuevo para actualizar la caché.

**No borres ningún archivo de GitHub todavía.** El inventario acumulado sigue
en **37 candidatos**, conservados hasta acabar toda la migración. El núcleo
de entrenamientos **no es un archivo retirado**; continúa cargándose tras el catálogo.

## Comprobaciones de publicación necesarias

- La biblioteca de ejercicios muestra los ejercicios propios y sus variantes.
- Se pueden abrir, editar y preparar sesiones y marcar asistentes.
- La aplicación vuelve a abrir sesiones guardadas sin perder información.
- El módulo Scouting conserva la puntuación, deshacer, vídeo y sincronización
  entre dos dispositivos (no se han modificado sus escritores).
- El botón de plegar/mostrar la barra lateral sigue funcionando.

La suite automatizada confirma compatibilidad estructural y carga del nuevo
catálogo; las comprobaciones con datos reales y dos dispositivos se deben
hacer tras publicar.
