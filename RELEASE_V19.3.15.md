# Volley Coach V19.3.15 · Scouting Editor Pro

**Base:** el ZIP entregado `volley-coach-main (6).zip`, fechado 13/11/2026, con V19.3.14 Integrated Video & Scouting Workspace.

## Qué cambia

- En **Análisis → Video Analysis**, cada contacto tiene **Editar** y el panel ofrece **Editar rally seleccionado**.
- Edita códigos con el parser de scouting ya existente; añade, elimina y reordena contactos sin tocar marcador, ganador, servicio, rotaciones ni tiempos originales de los rallies.
- Para **E (colocación)**: destino, tempo, llamada del colocador y tipo de colocación. Para **A (ataque)**: combinación, tempo, dirección, código, bloqueadores y tipo.
- **Usar fotograma actual** vincula un instante al contacto solamente si Video Review está reproduciendo el mismo partido y tiene una fuente identificada. La marca guarda la identidad de la fuente. Otra grabación vuelve a usar la sincronización del reloj original. No altera `scoutMs`, ni la alineación ni los datos usados para el marcador histórico del Delay.
- Guardado **sobre el scouting original** mediante el puente existente, con checkpoint previo si está disponible, rechazo de edición obsoleta, reversión si el guardado local falla, invalidación de cachés y actualización automática de Análisis/Video Review. No se modifica el motor de nube ni los módulos de sincronización.
- Los scoutings con estado `finished` deben reabrirse desde Gestión antes de modificarlos. Para evitar cambiar el scouting equivocado, el editor solo guarda el partido que esté activo.
- Edición rápida: Enter para añadir un código, Ctrl/Cmd + Enter para guardar, Escape para cerrar. El editor puede convivir con el vídeo en pantallas anchas.

## Publicación

1. **Copia de seguridad**: exporta JSON de los scoutings tanto del PC como del móvil. Si hay una diferencia entre dispositivos, resuélvela antes de sincronizar el despliegue.
2. Sube el contenido del ZIP completo a la raíz del sitio, o sustituye exactamente los archivos del ZIP incremental; en GitHub mantén la estructura de archivos indicada.
3. Publica y recarga la web (caché del Service Worker actualizada a V19.3.15) en ambos dispositivos.
4. Selecciona el mismo scouting en Gestión y en Análisis. Abre Video Analysis; comprueba que al elegir un contacto se abre el único reproductor original y que **Editar** abre el contacto esperado.
5. Corrige una valoración A (por ejemplo `-`→`#`), guarda, verifica recálculo de ataque y que el marcador histórico no cambie.
6. Abre la grabación de ese partido, pausa en un fotograma y márcalo. Comprueba que en la misma fuente se usa esa marca y que cambiar de archivo NO reutiliza ese tiempo como si fuera histórico.
7. En dos dispositivos, edita primero uno, sincroniza y comprueba que el otro refleja el cambio; verifica también que no desaparecen otros rallies, entrenamientos o grabaciones. **Esta prueba real de nube NO se ha ejecutado aquí.**

## Verificaciones técnicas efectuadas

- `node --check` en **128** módulos JS y **79** scripts inline HTML: 0 errores sintácticos.
- `node --test tests/v19315-editor.test.cjs`: **11 pruebas aprobadas**, incluyendo referencias estables, código, metadatos de vídeo, estadísticas, marcador protegido y fuente de grabación.
- `python tests/smoke_v19315_playwright.py`: comprobación aislada en Chromium con DOM real de apertura, cambio de ataque, campos avanzados, fotograma, persistencia simulada, recálculo, conflicto concurrente y rollback: OK.
- No se ha simulado un partido completo con vídeo y sincronización Supabase/Realtime real. Las 302 pruebas declaradas para V19.3.14 en el chat anterior no forman parte de este ZIP y no se han repetido.

## Incidencia heredada del archivo de origen

`index.html` referencia **11 archivos CSS no incluidos en el ZIP original**: `vc19-workflow.css`, `vc1920-connection-hub.css`, `vc1922-live-delay.css`, `vc1923-video-scout-links.css`, `vc1924-clip-studio.css`, `vc1925-library-health.css`, `vc1930-tactical-rivals.css`, `vc19310-professional-analysis.css`, `vc1937-analysis-main.css`, `vc1938-data-engine.css`, `vc1939-rally-search.css`.

**No** se han inventado sustitutos vacíos ni se han eliminado las referencias: el despliegue debe conservar las versiones correctas de esos archivos si las hay en el sitio. Pueden degradarse pantallas previas si faltan. Esta incidencia no procede de V19.3.15.
