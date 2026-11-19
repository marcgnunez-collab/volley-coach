# Volley Coach V20.5.31 · Controles Rally Search Pro

**Base de actualización: V20.5.30.** La nueva entrega mueve los eventos de filtro y presets del buscador Rally Search Pro a TypeScript, dentro del módulo ES6 de Vite.

## Qué cambia

- Los cambios de los desplegables provocan búsqueda con demora `0 ms`; la entrada de texto mantiene `350 ms` y cancela el evento anterior al seguir escribiendo.
- Los botones «Limpiar», «Guardar», «Aplicar», «Eliminar» y «Exportar CSV» utilizan el controlador TypeScript.
- Se mantiene la clave existente `vc1939:search-presets:1` de `localStorage`, con 15 búsquedas guardadas como máximo y los mismos campos; no se elimina ningún preset al actualizar.
- CSV conserva el nombre original normalizado y la limpieza del enlace temporal; las referencias a vídeo y a los IDs de rallies siguen en el adaptador histórico.
- Si el controlador TypeScript no existe o no se puede conectar, se instalan los eventos clásicos de la V19.3.9. Un panel que ya tiene eventos históricos no añade un segundo controlador.
- Gestión → Rendimiento incluye «Controles Rally Search Pro migrados a TypeScript» con contadores numéricos de eventos, búsquedas guardadas y exportaciones. No conserva búsquedas, nombres ni códigos.

**No se han modificado:** el escritor de puntuación, cambios de rotación, registro de acciones, IndexedDB, sincronización, archivos de vídeo ni datos del partido.

## Publicación en GitHub

### Si tienes V20.5.30

Descarga `Volley_Coach_V20.5.31_SOLO_CAMBIOS.zip`, descomprímelo y sube **el contenido** a la raíz del repositorio de Volley Coach. Conserva carpetas `src/`, `scripts/` y los scripts históricos. Sustituye únicamente los archivos coincidentes.

### Si no tienes V20.5.30

Usa `Volley_Coach_V20.5.31_COMPLETO.zip`. Contiene código y pruebas, sin `node_modules` ni `dist`.

### Publicación compilada

`Volley_Coach_V20.5.31_PUBLICACION_VITE.zip` es el contenido distribuible del directorio `dist/`; se publica en la raíz de la web y no se mezcla con los ZIP de código fuente.

## Comprobación funcional después de desplegar

1. Abre Scouting → Analizar → Búsqueda táctica y escribe varios caracteres seguidos; la búsqueda solo debería reflejar el texto final.
2. Cambia fundamento, jugador y valoración; los resultados deben actualizarse.
3. Guarda una búsqueda, cambia los filtros, recupérala y elimínala. Deben seguir existiendo los presets anteriores a esta versión.
4. Exporta el resultado a CSV y comprueba su contenido.
5. Verifica los saltos a vídeo y los IDs originales de rallies sin crear referencias nuevas.
6. Corrige y deshaz una acción en el scout y repite la búsqueda.
7. En Gestión → Rendimiento → Controles Rally Search Pro migrados a TypeScript, pulsa «Actualizar medición» para consultar los eventos.

La suite automática cubre estas rutas de forma aislada y verifica los escritores originales por hash. Aun así, las pruebas de navegador, vídeo y nube real deben realizarse tras la publicación; no están sustituidas por estas pruebas.
