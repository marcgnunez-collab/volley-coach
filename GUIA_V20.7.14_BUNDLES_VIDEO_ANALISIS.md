# Volley Coach V20.7.14 · Consolidación real de scripts de vídeo y análisis

## Qué hemos reorganizado

Dos módulos activos alojan ahora **11 scripts originales completos**, sin
cambiar su contenido ni el orden relativo de ejecución:

1. `132-vc1642-video-studio-pro.js` agrupa **7 scripts síncronos**:
   `118` asistente de sincronización de vídeo, `119` analítica de vídeo,
   `120` pista de zonas, `130` cabina Scouting Pro,
   `131` asistente de código, `121` clips y `132` estudio de vídeo.
2. `168-vc1881-setter-pro.js` agrupa **4 scripts con `defer`**:
   `135` hojas configurables, `136` laboratorio táctico,
   `167` análisis profesional y `168` colocadores.

Ambos bundles guardan cada fuente detrás de marcadores verificables.
Los scripts de origen están encapsulados en funciones autoejecutadas
independientes, no utilizan `document.currentScript` y no crean
declaraciones globales directas que puedan colisionar.

Se respeta que el primer bundle se ejecute inmediatamente y que el segundo
mantenga `defer`. Los demás scripts, incluidos los escritores de datos,
mantienen su orden de carga y sus archivos originales.

## Ahorro medido frente a V20.7.13

| Recurso | Antes: gzip por separado | Ahora: gzip combinado | Ahorro |
| --- | ---: | ---: | ---: |
| Siete scripts de vídeo y Scouting | 41.476 bytes | 35.602 bytes | **5.874 bytes** |
| Cuatro scripts de análisis | 22.376 bytes | 18.842 bytes | **3.534 bytes** |
| `index.html`, tras retirar nueve etiquetas | — | — | **44 bytes gzip** |
| **Total aproximado medido** | | | **9.452 bytes gzip menos** |

- **9 peticiones JavaScript activas menos**.
- Dos bundles conservados como entradas de carga, sin añadir archivos activos.
- El Service Worker precarga los dos bundles y deja de precargar versiones
  desplazadas, con un nombre de caché nuevo.
- Ningún archivo histórico se ha borrado; el inventario de retiro diferido
  crece de **41 a 50**.

Estas cifras corresponden al gzip calculado con nivel 9 y al HTML de esta
revisión. La compresión efectiva del servidor podría ser distinta.

## Seguridad y verificación

- Se recuperan del bundle los **11 cuerpos originales**, y se comparan uno
  por uno con sus hashes SHA-256 congelados y con los nueve archivos todavía
  conservados.
- Cada bloque y cada bundle se comprueba sintácticamente.
- Se verifica el orden de carga y que se conserva `defer` para los cuatro
  módulos de análisis.
- La auditoría confirma que no hay nuevas referencias huérfanas y que los
  50 archivos históricos están identificados.
- El núcleo Scouting, las consultas migradas, los escritores de puntos y
  Deshacer, IndexedDB y vídeo no se modifican en esta versión.

**Pendiente:** la prueba visual de la web publicada y la sincronización real
entre ordenador y móvil. Ejecuta esa comprobación antes de pensar en borrar
el código histórico.

## Actualización incremental en GitHub

1. **Base obligatoria:** V20.7.13 ya aplicada.
2. Descarga y descomprime **V20.7.14 SOLO_CAMBIOS**.
3. Sube únicamente los archivos del ZIP a la raíz de GitHub,
   conservando sus carpetas y sustituyendo los existentes.
4. **No borres ninguno de los 50 archivos históricos** en esta fase.
   Los nueve antiguos fusionados forman parte de esa lista.
5. No subas el ZIP de Vite por separado si sigues el procedimiento
   habitual de actualización incremental.

## Próximos pasos

Seguir identificando conjuntos de scripts que se puedan agrupar con
garantías de orden y estado. Después, verificar en el sitio real el circuito
de partido completo, el vídeo Live/Delay, el marcador, la barra lateral,
la nube y la presencia de dos dispositivos. Solo entonces se decidirá
qué archivos obsoletos retirar definitivamente.
