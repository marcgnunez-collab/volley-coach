# Guía de uso · V19.3.19.3 Setter Distribution Pro

## Acceso

1. Ve a **Partidos / Análisis**, selecciona el scouting correcto y comprueba el equipo.
2. Entra en **Analysis → Distribution**.
3. Elige entre **Distribución consecutiva** y **Distribución sobre bases**. Las dos vistas comparten filtros y un único origen de datos: las acciones del partido.

## Distribución consecutiva

En la parte superior hay seis columnas **P1–P6**, ordenadas por rotación. Cada tarjeta contiene acciones de colocación E y su ataque A relacionado, ordenados por set / rally / contacto. Se ven el volumen, uso de la rotación, kill y eficiencia (EFF). Los contactos sin rotación aparecen identificados aparte.

El registro inferior muestra set, rally, rotación, fase, recepción anterior comprobada, colocador, llamada, destino E, tempo, atacante, origen A, valoración y marcador si está disponible. Pulsa **Rally** para seleccionar la secuencia; pulsa **Vídeo** para abrir el reproductor del rally en Video Analysis. El vídeo solo se abrirá si existe una grabación enlazada.

## Distribución sobre bases

La pista compacta contiene **Z4, Z3, Z2, Z5, Z6 y Z1**. Por defecto representa el origen de los ataques A codificados; puedes cambiar a **Destino de colocación E** si existe ese campo. Cada zona indica N, porcentaje del total con zona registrada y eficiencia del ataque posterior.

El resumen de llamadas K no asigna una llamada a una acción que carece del campo `setterCall`. Las letras F/C/B/P/S se muestran exclusivamente si se guardó explícitamente el tipo en scouting; no se deducen de la posición de la pista.

### Seis matrices de análisis

- **Llamadas × zona de ataque**: distribución de cada llamada entre los orígenes A codificados.
- **Llamadas × atacante**: qué atacantes reciben la acción vinculada a cada llamada.
- **Llamadas × tempo**: tempo de colocación guardado en E.
- **Llamadas × combinación**: combinaciones explícitas E o A vinculadas.
- **Colocador × rotación**: secuencias reales por jugador E y P1–P6.
- **Recepción × ataque**: calidad R y origen A cuando están asociados en la misma secuencia comprobable.

Pulsa una pestaña para ver la tabla. Pulsa una **celda** para mostrar solamente sus rallies en el panel de evidencia; pulsa **Mostrar todos** para quitar esa selección. Los porcentajes de las celdas se calculan sobre las filas donde la variable de la columna está registrada; consulta «sin datos cruzados» para ver cuánto queda fuera.

## Filtros y exportación

Filtros comunes: set, fase K1/K2, rotación, tipo de secuencia, colocador, calidad de recepción y, en **Más filtros**, tempo, atacante, combinación, llamada K y tipo ofensivo. K1/K2 depende exclusivamente del equipo al saque registrado antes del rally.

**Exportar secuencias CSV** descarga las acciones que cumplen los filtros. Si has seleccionado una celda de matriz, exporta solo sus secuencias. El CSV conserva campos explícitos y utiliza la protección de fórmulas compatible con Excel.

## Si faltan datos

Una celda con «—» significa que no es posible calcular su porcentaje (denominador cero) o que faltan campos; no es un cero deportivo. Corrige las acciones desde **Scouting Editor Pro**, guarda y vuelve a actualizar Análisis. Los resultados se vuelven a calcular a partir del scouting, sin una segunda estadística persistida.

## Prueba recomendada antes de producción

Haz una copia de seguridad, carga un partido que tenga al menos dos sets, un colocador identificado, rotaciones y llamadas codificadas; comprueba manualmente las secuencias de una rotación, selecciona una celda y abre un vídeo. A continuación corrige una valoración de ataque y verifica que la eficiencia cambia sin afectar el marcador ni otro dispositivo. Comprueba en paralelo la sincronización PC/móvil con Supabase; este extremo no ha sido validado en la entrega aislada.
