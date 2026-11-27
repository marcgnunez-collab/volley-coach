# Volley Coach V20.7.11 · Informes y HTML optimizados

## Qué hemos migrado

El informe profesional y sus adaptadores de exportación dejan de cargarse
mediante dos scripts externos más cinco scripts incrustados. Todo el
JavaScript de informes se agrupa ahora en el módulo activo ya existente:

- `030-v752-native-pdf-fix.js`: contiene, en el orden anterior, el contenido
  íntegro de `029-v750-professional-reports-module.js`, la implementación
  original de `030` y los bloques inline `v753`, `v754`, `v755`,
  `v756` y `v757`.
- `index.html`: conserva las reglas CSS de PDF y un único enlace al módulo
  `030`, después de los estilos y antes de los siguientes módulos de
  cámara y grabación.

Los cuerpos originales se preservan con sus SHA-256, marcadores de inicio y
fin y comprobaciones de sintaxis. La app conserva las rutas existentes de
informes oficial/profesional, informes de entrenamientos y selección de
partidos; solo cambia su agrupación y momento de carga síncrona antes de
los módulos posteriores.

## Resultado medido

- **Un archivo JS activo menos**: se deja de solicitar directamente `029`.
- **33.254 bytes menos en `index.html`**.
- **3.194 bytes gzip menos** sumando el HTML y los scripts de informes activos
  antes y después (gzip nivel 9).
- El nuevo módulo queda precargado en el Service Worker para uso offline.
- Se conservan los escritores nativos y los mecanismos de guardado, nube,
  puntos, Deshacer, vídeo y rallies.

## Verificación

- Los siete originales se reconstruyen byte por byte desde el bundle.
- Se compila el módulo JavaScript y cada segmento conservado.
- La auditoría de recursos y la batería de regresión se comprueban también
  con las actualizaciones incrementales acumuladas.
- La comprobación visual automatizada en navegador no está disponible en este
  entorno. Se recomienda revisar los informes PDF oficiales, multipágina,
  la selección del partido y las descargas después de publicar en GitHub.

## Cómo subirlo

1. Debes tener **V20.7.10** instalada.
2. Descomprime **V20.7.11 SOLO_CAMBIOS**.
3. Sube a la raíz de GitHub únicamente sus archivos, sobrescribiendo los
   repetidos y conservando las subcarpetas.
4. **No borres el antiguo archivo `029`** ni ninguno de los anteriores.
   El inventario de retirada diferida ahora suma **41 archivos candidatos**.
5. No subas el ZIP Vite aparte si sigues tu procedimiento habitual de
   actualizaciones incrementales.

## Qué queda por hacer

Seguiremos consolidando módulos de análisis y Scouting, reduciendo los
recursos realmente cargados. Antes de eliminar archivos antiguos habrá que
comprobar en la aplicación publicada los informes, la nube, dos dispositivos,
el vídeo Live/Delay y el sistema completo de puntos y Deshacer.
