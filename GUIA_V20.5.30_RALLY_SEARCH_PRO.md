# Volley Coach V20.5.30 · Rally Search Pro en TypeScript

**Actualización incremental desde V20.5.29.** No cambia la manera de guardar partidos, puntos o vídeos.

## Qué cambia

- La plantilla HTML de Rally Search Pro (filtros, desplegables, catálogos de jugadores y colocadores, resultados y secuencias) ahora se genera en TypeScript y se empaqueta con Vite.
- El motor de consulta TypeScript V20.5.23 sigue realizando los filtros; la edición de acciones nativas se mantiene igual.
- Los eventos históricos conservan el foco en el código de búsqueda, la apertura de criterios avanzados, presets, exportación CSV, salto a vídeo y listado de rallies con ID original.
- Si el nuevo renderizador falla o no se encuentra, se utiliza la plantilla V19.3.9 existente.
- Gestión → Rendimiento incorpora «Vista Rally Search Pro migrada a TypeScript» con número de plantillas, tiempos y errores en esta sesión; no guarda los valores de búsqueda.

## Cómo publicarlo en GitHub

### Instalación sobre V20.5.29

Descomprime `Volley_Coach_V20.5.30_SOLO_CAMBIOS.zip` y copia **su contenido** a la raíz del repositorio `volley-coach`. Conserva las carpetas y sustituye solo archivos coincidentes. No borres los demás módulos.

### Instalación completa

`Volley_Coach_V20.5.30_COMPLETO.zip` trae todo el código y las dependencias declaradas, sin la carpeta `node_modules`. Sirve para recuperar o actualizar un repositorio que no esté en V20.5.29.

### Publicación compilada

`Volley_Coach_V20.5.30_PUBLICACION_VITE.zip` contiene el resultado de `vite build`. Sube **el contenido**, no una carpeta `dist` adicional. No mezcles este paquete con el de los fuentes.

## Comprobación rápida

1. Espera a que GitHub Pages publique y recarga la página para que cambie el service worker.
2. En Scouting → Analizar → Búsqueda táctica, filtra por jugador, colocador, recepción, rotación y vídeo.
3. Abre criterios avanzados y escribe en Código/texto; comprueba que el cursor permanece en el campo.
4. Guarda, vuelve a cargar y elimina una búsqueda predefinida.
5. Comprueba un salto a vídeo desde un rally y exporta una selección CSV.
6. Corrige o deshaz un rally, repite la búsqueda y verifica que cambien las cifras. No deben aparecer IDs inventados.
7. En Gestión → Rendimiento pulsa «Actualizar medición» y revisa «Vista Rally Search Pro migrada a TypeScript».

Las pruebas automáticas verifican igualdad exacta de plantillas y consultas, recuperación ante módulo ausente, correcciones y deshacer. Queda pendiente la validación de navegador y nube sobre dos dispositivos reales.
