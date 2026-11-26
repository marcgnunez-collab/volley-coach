# Volley Coach V20.5.77 — Edición de rallies protegida con TypeScript

## Resultado de la cuarta fase de la reestructuración

El editor profesional de rallies ahora utiliza un **módulo TypeScript real**
para las operaciones del borrador y la preparación del guardado. El código
histórico sigue siendo el único responsable de aplicar la corrección al rally,
guardar el partido y lanzar su copia de recuperación.

La versión corrige una situación peligrosa: antes, el editor abría una copia
de las acciones de un rally, pero al guardar buscaba el identificador del
rally en **el partido activo en ese momento**. Si se cambiaba de partido y
existía un rally con el mismo identificador, se podía modificar el destino
incorrecto.

Ahora, al abrir el editor, queda ligada la identidad exacta de:

- Partido de origen.
- Set de origen, incluso si se está corrigiendo un set antiguo.
- Rally de origen, no solo su ID numérico.
- Array original de acciones y una huella de su contenido completo.

Si cualquiera de esas identidades o el contenido original cambia mientras
el editor está abierto, la corrección se **rechaza** y se pide reabrirlo. No
se sobreescribe el otro partido, ni una actualización recibida entretanto.

## Qué se ha migrado

- `src/domain/rally-editor-lane.ts`: funciones puras de captura y comprobación
  del rally, movimiento, inserción, duplicado mediante inserción de una copia
  preparada y eliminación de acciones, y preparación del parseo del guardado.
- `src/domain/rally-editor-lane-runtime.ts`: puente inmutable
  `VC_RALLY_EDITOR_LANE_20577`.
- `src/vc2055-entry.ts`: instalación en el módulo TypeScript/Vite.
- `021-core-scouting-v150-monolithic.js`: conexión del editor V6.8/V8.4 a las
  funciones tipadas. Mantiene el parser y guardado únicos de siempre.
- `vc20577-rally-editor-lane.test.cjs`: pruebas puras y pruebas integradas
  contra los controladores originales extraídos del script histórico.

Los botones **↑, ↓, Duplicar, Eliminar, Añadir al inicio y Añadir al final**
operan sobre un borrador en memoria; no suman puntos ni escriben acciones
durante su uso. Al guardar, cada código se interpreta una vez y se comprueba
el contexto de nuevo antes de aplicar el cambio. Si el nuevo puente aún no
está disponible, la preparación clásica conserva las mismas protecciones.
Los códigos que ya se hayan escrito en una casilla también se conservan al
mover o duplicar la fila, aunque todavía no se haya pulsado Guardar.

## Seguridad y compatibilidad

- Se conservan puntuaciones, ganadores, rotaciones y Deshacer.
- Se mantienen los metadatos de vídeo, REC, Delay, Data Volley, fecha y
  jugador a través del parser original y de las acciones previas.
- No se crea un segundo escritor de rallies, acciones, puntos, copias,
  IndexedDB o CAS/Supabase.
- La copia de recuperación continúa activándose **solo después del guardado**
  original.
- Un parser fallido o código inválido detiene el guardado; un cambio remoto
  o de partido impide toda persistencia.
- No se repite un parser si un adaptador falla después de haberlo invocado.

Esta fase no sustituye todavía el estado global ni la sincronización
autoritativa. La protección por huella es **preventiva en el editor local**, no
una transacción distribuida de comparación y escritura con Supabase.

## Pruebas

Se comprueban, mediante simulaciones independientes:

1. Borrador TypeScript con referencias estables y sin mutar las acciones
   originales antes de guardar.
2. Reordenación, eliminación, inserción y casos de índice inválido.
   Se verifica la conservación de cambios escritos antes de reordenar.
3. Preparación de 50 acciones, cada código una vez y nueva secuencia correcta.
4. Corrección real del controlador V6.8 con conservación de vídeo y marcador.
5. Cambio a otro partido con **el mismo identificador de rally**.
6. Sustitución de rally o set, edición remota de acciones y cambio durante
   el parseo.
7. Código inválido, módulo aún no cargado y excepción temprana o tardía.
8. Una sola invocación de guardado y copia de recuperación tras éxito.

Las pruebas automáticas no equivalen a un ensayo con navegador, vídeo físico
y dos dispositivos reales. No utilices un partido oficial como primera prueba
de la actualización.

## Validación manual recomendada

1. Exporta una copia JSON de tus datos y termina la sincronización.
2. Abre un partido de prueba con varios rallies cerrados.
3. Corrige un código, reordena ↑↓, duplica, elimina y añade al principio y
   al final. Guarda y verifica las acciones y estadísticas.
4. Abre un rally de un set antiguo, corrige una acción y confirma que el
   marcador y las rotaciones no cambian.
5. Abre el editor, cambia a otro partido (idealmente uno con identificadores
   de rally coincidentes) e intenta guardar: debe bloquearse.
6. Repite tras modificar el rally desde otro dispositivo: no debe sobrescribir
   el trabajo recién sincronizado.
7. Comprueba vídeo, REC/Delay, clips, Deshacer y los indicadores PC/móvil.
8. Revisa la sincronización y los pendientes antes de usar datos reales.

## Subida a GitHub

- **SOLO_CAMBIOS:** descomprime **sobre la raíz de la versión V20.5.76** de
  GitHub. Sube todos los archivos nuevos y sustituye los modificados,
  respetando `src/domain/` y `test-audit/`. **No elimines scripts clásicos**.
- **COMPLETO:** copia del código fuente V20.5.77 para conservar como respaldo.
- **PUBLICACION_VITE:** distribución compilada para hosting estático; no
  mezclarla con los archivos fuente en la raíz de GitHub.

Después de actualizar, ejecuta `npm run test:foundation` y `npm run build`
o revisa la ejecución equivalente de GitHub Actions.

## Próxima fase

Continuar la migración del estado transaccional de scouting y los flujos de
edición histórica, con controles de concurrencia y verificación real de
dispositivos antes de reemplazar el almacenamiento nativo.
