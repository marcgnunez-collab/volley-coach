# Volley Coach V20.7.10 · Menos módulos activos de vídeo

## Resultado

La cadena histórica de **cinco scripts JavaScript de vídeo** se reorganiza
en **dos bundles ya existentes**, sin perder el orden de ejecución de ninguno:

| Bundle activo | Código incluido, en orden |
| --- | --- |
| `026-v720-clip-studio-module.js` | `024` persistencia, `025` análisis, `026` Clip Studio |
| `028-v740-live-scout-video-module.js` | `027` Live/Delay, `028` vídeo con Scouting |

La página ya no solicita directamente los archivos `024`, `025` y `027`.
Siguen existiendo como fuentes antiguas conservadas hasta el final de la
migración, pero **no son recursos JavaScript activos en la página**.

- **Tres solicitudes JS menos** para cargar las mismas funciones.
- **2.327 bytes gzip menos** en el conjunto de estos cinco scripts frente a los dos bundles finales (compresión gzip nivel 9).
- El HTML mantiene los bloques de estilos de vídeo, los módulos de políticas
  Live/Delay y los scripts de informes en su orden relativo.
- La caché offline precarga ahora los bundles `026` y `028` en lugar del antiguo
  `027`.

## Seguridad de los datos y del vídeo

- Los cuerpos originales de los cinco scripts se conservan **byte por byte**,
  separados mediante marcadores; sus SHA-256 se comprueban en las pruebas.
- Se conserva la secuencia original: persistencia → análisis → clips →
  políticas de Delay/revisión → Live/Delay → Scouting+vídeo.
- No se modifican las funciones nativas de grabación, vídeo, puntos,
  Deshacer, historial, IndexedDB o sincronización.
- La auditoría de dependencias de los activos y las pruebas de regresión
  se ejecutan también con los ZIP acumulados.

Tras publicar, conviene hacer pruebas reales en dos dispositivos: Live,
Delay, REC, creación/reproducción de clips, carga de vídeos e historial de
rallies. Las pruebas automatizadas no sustituyen esa comprobación.

## Qué subir a GitHub

1. La base debe ser **V20.7.9**.
2. Descarga **V20.7.10 SOLO_CAMBIOS**.
3. Copia únicamente su contenido a la raíz de tu repositorio, respetando
   subcarpetas y reemplazando los archivos modificados.
4. **No elimines nada.** El inventario registra ahora **40 archivos antiguos
   candidatos** a retirada futura (37 previos + 3 sustituidos en V20.7.10).
5. Si publicas con los ZIP incrementales de siempre, no necesitas subir
   el ZIP Vite por separado.

## Próxima fase

Seguir consolidando módulos activos y reduciendo cargas repetidas de Scouting
y análisis. Cuando la migración esté terminada, realizar una auditoría de
funciones, recursos, almacenamiento y sincronización real antes de preparar
las eliminaciones finales.
