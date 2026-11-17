# Guía · Volley Coach V19.3.19 · Bench Client Pro

## Acceso

1. Abre Volley Coach con la cuenta y el equipo habituales.
2. Entra en **Banquillo Pro**.
3. Selecciona un partido desde el selector superior.
4. Pulsa **Bench Client Pro**. La nueva vista sustituye visualmente al panel clásico, sin modificarlo ni borrar sus configuraciones.
5. Para regresar, pulsa **Vista clásica**. Puedes volver a entrar en cualquier momento.

## Uso en un segundo dispositivo

1. Abre **Bench Client Pro → Copiar enlace de consulta**.
2. Ábrelo en el dispositivo del cuerpo técnico. El enlace añade `banquillo=1&modo=consulta&bench=pro`.
3. Es imprescindible iniciar sesión con una cuenta que tenga permiso para ver el equipo y esperar a que el partido esté disponible mediante la sincronización existente. El enlace **no incluye permisos de acceso ni los scoutings**.
4. Verifica nombre del partido, marcador, set y conexión. La etiqueta «Canal Realtime conectado» solo verifica la suscripción de transporte; **no prueba** que los datos del partido sean recientes o idénticos al otro dispositivo.
5. Si aparece «Nube sin confirmar» o «Sin conexión», los datos que ves podrían ser locales o estar desactualizados. Contrasta el último rally con el dispositivo del analista.

## Lectura del panel

- **Marcador**: utiliza únicamente `scoreUs` y `scoreOpponent` del set registrado. No reconstruye puntos a partir de resultados o valoraciones individuales. Si un tanteo falta aparece `—`.
- **K1 / Side-out**: rallies cerrados ganados por el equipo seleccionado cuando recibía el saque, dividido por rallies cerrados con saque contrario identificado.
- **K2 / Break**: rallies cerrados ganados por el equipo seleccionado cuando sacaba, dividido por rallies cerrados con saque propio identificado.
- **Eficiencia de ataque**: `(ataques # − ataques = − ataques /) / ataques evaluados × 100`. Una valoración de ataque no modifica el marcador.
- **Recepción positiva**: `(recepciones # + recepciones +) / recepciones evaluadas × 100`.
- **Rotaciones**: R1–R6, con resultados K1/K2 y eficiencia ofensiva del equipo seleccionado, usando la rotación codificada de cada rally. Sin datos figura `—`.
- **Últimas jugadas**: lista de rallies cerrados en orden inverso, con set, posición, resultado, fase, rotación y tanteo posterior cuando consta expresamente. Pulsa una jugada para abrir sus contactos.
- **Revisar acciones**: desde la vista normal se puede abrir Video Analytics con los identificadores originales. En **modo consulta** el acceso a la edición/navegación fuera del banquillo se mantiene limitado. Para reproducir vídeo debe existir la grabación asociada accesible desde ese dispositivo; la pantalla no distribuye el archivo.
- **Filtros**: cambia entre equipo propio/rival, set actual/todos/un set concreto, rotación y longitud de la lista reciente (5, 10 o 20 rallies). No cambian el scouting.

## Actualización de datos

El cliente lee los mismos partidos del motor `VC_SCOUT_VIDEO_BRIDGE` y usa el mecanismo de sincronización que ya tiene Volley Coach. Reconsulta los datos mientras la pantalla está activa y visible. Al corregir una acción en otro dispositivo, los cálculos se actualizan **cuando el cambio ha llegado a la copia local**. Un canal Realtime conectado no implica sincronización correcta si el motor subyacente tiene incidencias.

## Seguridad y límites

- La interfaz nueva no ejecuta guardados, cambios de puntos, ni ediciones de scouting. **Modo consulta es una restricción de interfaz, no un sistema adicional de permisos de servidor.** La autorización real depende de la cuenta, el equipo y las políticas de Supabase.
- No incorpora un servidor de streaming ni un nuevo motor de sincronización.
- Las alertas son observaciones descriptivas y se muestran solo cuando hay una muestra suficiente; no sustituyen al entrenador.
- Está probada en aislamiento con datos de ejemplo y pruebas unitarias. No se ha validado aún en un partido real con dos dispositivos y Supabase.

## Instalación

Para actualizar desde **V19.3.18 completa**, copia los archivos de `Volley_Coach_V19.3.19_SOLO_CAMBIOS.zip` en la raíz del repositorio, conservando rutas. Haz antes una copia de seguridad de los scoutings y prueba la carga en modo normal y consulta. El ZIP completo reconstruye la base V19.3.18 e incluye los archivos nuevos.
