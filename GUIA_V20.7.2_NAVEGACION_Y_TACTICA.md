# Volley Coach V20.7.2 · Barra lateral y consolidación JavaScript

**Base:** V20.7.1. **Entrega recomendada:** SOLO_CAMBIOS.

## Barra lateral izquierda

### Escritorio (861 px o más)

- El botón pequeño de la propia barra lateral **la oculta en todas las vistas**, no solo en Scouting Match.
- El botón de menú de la cabecera **permanece visible y la vuelve a mostrar**. El botón puede ocultar o recuperar la navegación desde Inicio, Gestión, Entrenamientos, Análisis o Scouting.
- En Scouting Match se conserva la preferencia anterior de **arrancar con la navegación plegada**, priorizando el vídeo; el estado de las otras vistas es independiente y comienza abierto.
- Las decisiones se recuerdan localmente en el navegador; se mantienen la ruta de teclado **Alt+Mayús+M** y los atributos accesibles del botón.
- La cabecera y el contenido ganan espacio al esconder la navegación; al mostrarla recuperan su distribución.

### Móvil (hasta 860 px)

- No se cambia la lógica histórica del menú de tipo cajón. El botón abre y cierra la barra superpuesta, el fondo puede cerrarla y no se aplica la regla de escritorio.
- Los estados y etiquetas accesibles se sincronizan con la apertura del cajón; al ampliar la pantalla se retira un cajón móvil que pudiera haber quedado abierto.

## Migración de tres scripts de análisis a uno

Los módulos read-only `227`, `228` y `229`, que ya se ejecutaban consecutivamente, se han agrupado en `vc2072-tactical-intelligence-unified.js`, con su contenido copiado byte a byte y en el mismo orden:

1. Integridad estadística.
2. Inteligencia de rivales.
3. Asistente táctico de directo.

Esto elimina **dos solicitudes JavaScript** y dos archivos activos. El nombre del script se actualiza en HTML y caché. **No se han alterado sus API, cálculos ni manejadores**, ni los propietarios del guardado, la nube, el vídeo o el marcador.

## Aplicación en GitHub

1. Comprueba que tienes aplicada V20.7.1, incluidos los diez CSS retirados de esa versión.
2. Descarga y descomprime `Volley_Coach_V20.7.2_SOLO_CAMBIOS.zip`.
3. Sube su contenido a la raíz de GitHub, respetando todos los subdirectorios y nombres, y sustituye los archivos que ya existan.
4. Elimina los tres JS indicados en `ELIMINAR_DE_GITHUB_V20.7.2.txt` de GitHub. Conserva el nuevo `vc2072-tactical-intelligence-unified.js`.
5. Espera al despliegue, recarga la aplicación y comprueba ocultar/mostrar la barra desde Inicio, Gestión, Scouting Match y Análisis. Comprueba el cajón también en un móvil.

El paquete **PUBLICACION_VITE** es una alternativa para despliegues por build; **no tienes que subirlo aparte** si actualizas con SOLO_CAMBIOS.

## Siguiente paso de arquitectura

Seguir separando módulos de interfaz y módulos de lectura de los escritores críticos. Cada grupo retirado debe conservar orden de ejecución, tener pruebas, pasar la auditoría de recursos y demostrar equivalencia sobre la versión anterior.
