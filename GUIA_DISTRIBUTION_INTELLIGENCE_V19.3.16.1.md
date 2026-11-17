# GUÍA PROFESIONAL · Distribution Intelligence Pro

**Volley Coach V19.3.16.1 · 15 de noviembre de 2026**

Esta guía explica, por separado, **cómo se utiliza la distribución en Data Volley 4** según la documentación pública y **cómo utilizar la implementación disponible en Volley Coach**. No son el mismo programa ni existe certificación de equivalencia total. Los nombres y la posición exacta de los controles en Data Volley pueden cambiar entre ediciones.

## A. Cómo funciona la distribución en Data Volley 4

**Fuentes consultadas**

- [Página oficial Data Project / Data Volley 4](https://www.dataproject.com/Products/EU/en/Volleyball/DataVolley4)
- [Manual Data Volley 4, edición inglesa](https://www.scribd.com/document/852270479/DVWin4-HandBook-Eng), apartados **9.5.9 Consecutive Distribution** y **9.5.10 Setter Call Distribution**
- [Referencia visual oficial de ambas vistas (Data Project)](https://www.dataproject.com/Products/EU/it/Volleyball/DataVolley4)

### A.1. Preparación de datos en Data Volley

Para utilizar **Consecutive Distribution**, deben haberse registrado las **zonas de origen de ataque o las combinaciones de ataque**. Sin ellas no se puede saber a qué zona se refiere cada ataque. El programa no debería inventar la posición del atacante.

Para utilizar **Setter Call Distribution**, también deben haberse definido y codificado las **llamadas del colocador** y las **combinaciones de ataque**. En Data Volley, una llamada puede asociarse al código `K...`, con descripción, notas, el movimiento del central y la zona de colocación. El estudio se hace sobre ese dato previamente registrado.

### A.2. Distribución consecutiva en Data Volley 4

1. Abre el partido que quieras analizar y accede al menú **Analysis → Consecutive Distribution** (nomenclatura de la edición inglesa del manual).
2. Elige el **equipo**, los **sets** y el análisis de ataque (por ejemplo, ataque tras recepción o ataque de transición).
3. Es recomendable **desglosar por rotación** para distinguir P1, P2, P3, P4, P5 y P6. También puedes utilizar los filtros de la ventana de análisis, entre ellos los relacionados con la recepción.
4. Ejecuta el análisis. El programa muestra la distribución del colocador **punto a punto**, con las acciones de ataque y su resultado. Cuando se analiza un ataque posterior a la recepción, aparece el valor de la recepción anterior.
5. Utiliza **Rotation + / −** cuando estés consultando una rotación concreta, o haz clic en las celdas para obtener las acciones relacionadas. El acceso a vídeo depende de que el partido tenga grabación vinculada.
6. Desde el menú de análisis es posible **guardar la imagen** para composiciones impresas, según el manual.

**Interpretación:** las columnas de rotación permiten detectar variaciones en los destinos de ataque y sus efectos. Un porcentaje elevado no demuestra por sí solo qué decisión fue mejor: también debe comprobarse calidad de recepción, rival, tipo de bloqueo y tamaño de la muestra.

### A.3. Distribución de llamadas del colocador en Data Volley 4

1. Define y registra previamente las llamadas del colocador y las combinaciones de ataque.
2. Entra en **Analysis → Setter Call Distribution**.
3. Selecciona el **equipo**, los filtros pertinentes y las **llamadas K** que quieras mostrar.
4. Escoge si deseas **una pista conjunta**, **una pista por cada llamada** o **ambas vistas**.
5. El resultado muestra frecuencias absolutas y porcentajes de distribución y, cuando se han definido, los **recorridos del central**. En la nomenclatura documentada aparecen grupos F, C, B, P y S para opciones de ataque.
6. Desde **Settings**, el manual describe opciones de **giro de pista**, **mostrar el movimiento del central** y **alinear llamadas**. También permite ir a los rallies asociados y guardar la imagen.

**Punto decisivo:** un campo que solo contiene `K1` o `K2` indica qué llamada se registró, pero **no describe por sí mismo el recorrido del central**. Un dibujo táctico exacto necesita la definición del movimiento correspondiente.

---

## B. Cómo funciona Distribution Intelligence Pro en Volley Coach V19.3.16.1

### B.1. Dónde está

1. Abre tu aplicación Volley Coach.
2. Entra en **Análisis** y selecciona un **scouting** real mediante el selector del módulo de análisis.
3. En la barra superior elige **equipo propio / rival**, **set**, **fase** y **rotación** según tus necesidades. Estos filtros generales se aplican también a Distribution.
4. Pulsa la pestaña **Distribution**. Verás **Distribución táctica del colocador**.
5. Selecciona **Distribución consecutiva** o **Llamadas del colocador**.

> La pantalla es de **solo lectura**. No modifica los scoutings, tanteos, vídeos ni estados de la nube; los cambios de contactos se hacen en Scouting Editor Pro.

### B.2. Primera pestaña: Distribución consecutiva

La matriz contiene **P1–P6**. Cada columna corresponde a una rotación del equipo seleccionado y cada tarjeta sigue el orden de **set, rally y acción de colocación**. Si una rotación no tiene acciones, la columna indica que no existen secuencias registradas; no se generan datos sintéticos.

**Cómo leer una acción:**

- `S1 · #12`: set 1, rally número 12 dentro de ese set.
- `R+`: se ha identificado una **recepción anterior** con valoración `+` en la misma cadena de posesión. `R—` indica que **no hay recepción previa verificable**; **no** significa valoración negativa.
- `8 → 5`: colocación del jugador identificado como 8 seguida del ataque del jugador 5. Solo se vinculan acciones de la **misma posesión**.
- `Z4`: zona de **origen de ataque** del contacto A, si se codificó. Una `Z?` significa que no consta.
- `#`, `+`, `!`, `-`, `/`, `=`: valoración **del ataque** cuando existe; `s/v` indica que el contacto A no tiene valoración válida.
- `3–2`: marcador **después del rally**, únicamente cuando consta en la fuente original. `marcador —` es desconocido.
- La hora `mm:ss` que aparece es una referencia del **reloj de scouting** (`scoutMs`) si está disponible, no la garantía de que coincida con el reloj del vídeo.

**Cómo filtrar:**

- **Rotación P1–P6**: pulsa el encabezado P para aplicar o retirar esa rotación; también puedes usar el desplegable.
- **Tipo de secuencia**: tras recepción, tras defensa/transición o fase no identificable. El sistema usa contactos R y D reales **anteriores** a E, sin atravesar un ataque o una colocación previa.
- **Colocador** y **atacante**: selecciona el jugador que intervino en la misma secuencia E → A.
- **Calidad recepción**: elige `#`, `+`, `!`, `-`, `/` o `=`. Solo entran cadenas con recepción anterior evaluada.
- **Tempo E** y **combinación**: deben existir en los campos avanzados de las acciones.
- **Llamada K** y **tipo F/C/B/P/S**: aplican únicamente cuando se han registrado explícitamente.
- **Agrupar pista**: cambia entre **origen de ataque A** y **destino E**. No mezcles ambos al comparar proporciones: son variables diferentes.

Los filtros generales de la parte superior y los locales **se acumulan**. Pulsa **Limpiar filtros** para retirar los filtros locales; no se modifica la selección general del partido.

### B.3. Segunda pestaña: Llamadas del colocador

Pulsa **Llamadas del colocador**. La vista contiene tres partes:

**Distribución conjunta.** Reúne las llamadas K expresamente codificadas. Se representa sobre una pista con recuentos y porcentajes por zona. Las flechas son **esquemas de frecuencia**, no trayectorias físicas medidas.

**Tabla de llamadas.** Muestra cada código K con cantidad de colocaciones, porcentaje de uso, ataques asociados y eficiencia. Una fila **«Sin llamada»** conserva los contactos que no tienen ese dato. Pulsar una llamada filtra el resto del análisis por el mismo código K.

**Pistas individuales.** Si eliges **«Conjunta + por llamada»** o **«Pistas individuales»**, obtienes un desglose independiente por K. El modelo visualiza hasta 24 grupos para mantener un tamaño manejable; los cálculos no inventan las llamadas ausentes.

Puedes cambiar la opción **Vista de llamadas** entre **conjunta**, **por llamada** y **ambas**, así como **girar la pista 180°** (solo cambia la representación gráfica, no los códigos ni el significado de las zonas).

**Tipos F/C/B/P/S:** el cuadro cuenta opciones ofensivas si `dvSetType` se ha registrado con uno de esos valores. No deduce que Z3 sea central, ni que Z6 sea pipe: esas asociaciones pueden variar según sistema y combinación.

**Limitación respecto a Data Volley 4:** esta versión **no reproduce automáticamente el recorrido/entrada del central ni la zona de intervención de cada llamada K**, porque el origen de datos disponible no incluye un catálogo de caminos gráficos. Se indica expresamente en pantalla, en vez de fabricar esos movimientos.

### B.4. Cómo ir al vídeo de una jugada

1. Filtra y localiza la acción que quieres estudiar.
2. Pulsa la tarjeta de la secuencia o el rally en la lista **Rallies de la selección**.
3. Si el rally tiene acciones con vínculo de vídeo, utiliza **Abrir rally en vídeo**. Si no, el botón queda deshabilitado.
4. Puedes pulsar **Ir a Video Analysis** para abrir el espacio de vídeo original con el rally seleccionado si sigue estando en los filtros vigentes.
5. Si el vídeo no aparece, comprueba que exista un vínculo real entre scouting, acción y grabación; este módulo **no crea marcas temporales** ni reconstruye vídeos faltantes.

### B.5. Cómo codificar los datos que necesita la distribución

En el partido, abre el **Scouting Editor Pro** sobre el rally correspondiente. En la acción **E** registra, cuando proceda: dorsal o jugador, `setTarget`, `setTempo`, `setterCall` (`K1`, `K2`, etc.) y `dvSetType`. En la acción **A** registra: jugador atacante, **zona de origen** en el código o campo avanzado, `attackCombo`, evaluación y, si corresponde, `dvSetType`.

**Atención a la compatibilidad de códigos:** el parser y las listas de valores válidos son los del editor existente. Por ejemplo, los desplegables actuales de destino E admiten ciertas combinaciones (`Z4`, `Z2`, `Z1`, `Z6`, `1T`, `31`, `BACK`, `PIPE`, etc.). Una combinación como `1T` **no es una zona física Z1**. La nueva pantalla solo utiliza destinos que se puedan interpretar como **Z1–Z6** para dibujar posiciones; los demás no se convierten automáticamente. La llamada K y el tempo se leen de sus **campos explícitos**, nunca de suposiciones tácticas.

Pulsa **Guardar y recalcular** y vuelve a Análisis. Se reconstruye el modelo estadístico desde el scouting original. Si otra sesión cambió el partido, el editor existente puede bloquear el guardado para evitar pérdida de datos.

### B.6. Cómo entender los números

- **E**: número de acciones de colocación del filtro, estén o no seguidas de un ataque.
- **A**: colocaciones con un ataque posterior enlazado de forma verificable.
- **A val.**: ataques asociados que tienen valoración válida.
- **Uso de una zona / llamada**: recuento de esa categoría dividido por el total de **colocaciones del filtro** en la tabla. Las casillas de pista usan como denominador solo las que tienen la **zona correspondiente conocida**, indicado debajo del gráfico.
- **Kill %**: ataques `#` / ataques asociados valorados.
- **EFF %**: `100 × (ataques # − ataques = − ataques /) / ataques asociados valorados`. Las demás valoraciones no se tratan como puntos ganados. Si el denominador es cero, se muestra `—`.
- **Llamadas explícitas**: acciones E que contienen `setterCall`. El resto queda como no codificado.
- **Clasificación de fase**: una recepción R anterior en la misma posesión se clasifica «tras recepción». Si el precedente identificable es una defensa D, se clasifica «transición». En los demás casos se muestra «fase no identificable». Esto **no sustituye** los indicadores oficiales K1/K2 basados en saque y ganador del rally.

### B.7. Exportación y uso táctico

Pulsa **Exportar secuencias CSV**. El archivo contiene el filtro actual y referencias a set, rally, rotación, acciones E/R/A, colocador, atacante, zona explícita, tempo, llamada K, combinación, valoración y resultado **registrado**. No se exporta un montaje, una hoja Excel `.xlsx` ni una imagen en esta versión. El CSV previene que una celda de texto se ejecute como fórmula al abrirse en programas de cálculo.

**Ejemplo hipotético de lectura táctica:** si en P3 con recepción `+` aparecen 15 colocaciones y 9 tienen ataque desde Z4, la frecuencia de Z4 es 60% entre las **15 que tengas filtradas**; si solo 12 de las 15 tienen origen de ataque, el gráfico específico de zonas calculará su porcentaje sobre **12**. Revisa siempre los denominadores antes de comparar.

### B.8. Errores frecuentes y cómo interpretarlos

| Síntoma | Comprobación |
|---|---|
| Matriz vacía | ¿Hay scouting seleccionado, rallies cerrados y acciones E? ¿Los filtros generales o locales excluyen todo? |
| Hay E, pero «Origen A» vacío | Falta `startZone` de la acción A; `setTarget` no lo sustituye |
| No aparecen llamadas | Falta el campo `setterCall` explícito, no basta con la fase de rally `K1/K2` |
| No aparecen tipos F/C/B/P/S | Falta un `dvSetType` válido en E o A |
| R— aparece junto a un ataque | No hay una R verificable anterior a la E en esa cadena; no significa mala recepción |
| El vídeo no abre | No hay vínculo real de acciones a grabación en el scouting actual |
| Diferencias de porcentajes entre tabla y pista | Tabla: total de colocaciones del filtro; pista: subconjunto con zona explícita |
| El mapa muestra pocas zonas | Los destinos E con códigos de combinación (`31`, `PIPE`...) no se transforman artificialmente en zonas Z1–Z6 |
| Otro dispositivo muestra datos antiguos | Esta vista es de solo lectura; la sincronización de Supabase y la resolución de conflictos se validan por separado |

---

## C. Paridad y tareas pendientes (no confundir con funcionalidades terminadas)

| Capacidad | Data Volley 4 documentado | Volley Coach V19.3.16.1 |
|---|---|---|
| Distribución punto a punto | Sí | Sí, sobre secuencias E → A reconocidas |
| Desglose P1–P6 | Sí | Sí, para rotaciones registradas |
| Calidad de recepción y ataque | Sí | Sí, solo valoraciones verificables |
| Filtros por colocador, set, rotación, llamadas | Sí | Sí, con los filtros actuales del motor |
| Pistas conjuntas y por llamada | Sí | Sí, mediante agrupación de códigos K |
| Opciones F/C/B/P/S | Sí | Sí, si `dvSetType` lo contiene explícitamente |
| Recorridos dibujados del central | Sí, con llamadas configuradas | **Pendiente: catálogo gráfico de llamadas y movimientos** |
| Celdas → contactos/rallies | Sí | Sí, rally original y salto a vídeo disponible |
| Guardar imagen para composiciones | Sí | **Pendiente; CSV disponible** |
| Análisis combinado de varios partidos | Sí | **No incluido en esta pantalla** |
| Sincronización en vivo con dos dispositivos | Funciones cliente documentadas | **No validado en este entorno** |

**Límite de verificación:** las pruebas automatizadas y visuales son unitarias / aisladas en Chromium. No equivalen a una prueba completa del programa con un partido real, un vídeo real, los dos dispositivos y Supabase.

**Recomendación de prueba antes de usarlo en competición:** guarda primero una copia de seguridad del partido. Abre P1–P6, aplica recepción `#` y `+`, verifica manualmente 10 secuencias E → A en el scouting original, prueba K1/K2 como llamadas, registra un movimiento de central únicamente donde exista en el archivo, corrige un ataque, recalcula y comprueba que marcador, tiempo y vídeo no cambian sin autorización. Repite desde móvil y PC para validar sincronización.
