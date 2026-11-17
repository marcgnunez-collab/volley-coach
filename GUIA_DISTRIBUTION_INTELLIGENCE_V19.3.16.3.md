# Volley Coach V19.3.16.3 · Guía de Distribution Intelligence Pro

## Alcance y comparación con Data Volley 4

La pantalla **Análisis → Distribution** ofrece dos modos distintos:

- **Distribución consecutiva**: análisis punto a punto del orden real de colocaciones, ataques y recepción anterior cuando es verificable, agrupado por P1–P6.
- **Llamadas del colocador**: distribución de las llamadas K explícitas, su frecuencia y su relación con zona/atacante/eficacia.

La organización está inspirada en Data Volley 4, **pero no es una reproducción exacta**: Volley Coach todavía no registra un catálogo gráfico completo de movimientos del central y no debe inventarlos. Data Volley 4 tiene su propio sistema de codificación y reglas de análisis que deberán contrastarse en la auditoría V19.3.20.

## 1. Qué hay que registrar en el scouting

Para que las tablas tengan información suficiente, registra los contactos reales de una misma posesión y sus datos, cuando se conozcan:

| Contacto | Campo en Volley Coach | Qué permite analizar |
|---|---|---|
| Recepción R | `evaluation` | Calidad de recepción previa (`#`, `+`, `!`, `-`, `/`, `=`) |
| Colocación E | `player`, `setTarget` | Colocador y zona de distribución registrada |
| Colocación E | `setTempo` | Tempo de colocación |
| Colocación E | `setterCall` | Llamada K (p. ej. K1), solo si se ha introducido |
| Colocación E o ataque A | `attackCombo` | Combinación explícita, si está disponible |
| Ataque A | `player`, `startZone`, `evaluation` | Atacante, origen y eficacia |
| E/A | `dvSetType` | Opción ofensiva F/C/B/P/S cuando esté realmente codificada |

La ausencia de un campo se visualiza como `—` o «sin codificar». **No equivale a un error ni debe contarse como cero negativo**.

## 2. Abrir Distribution

1. Entra en **Scouting / Análisis**.
2. Selecciona el partido y el equipo correctos; comprueba que aparece el partido esperado.
3. Haz clic en **Distribution**.
4. Escoge **Distribución consecutiva** o **Llamadas del colocador**.
5. Usa los cuatro filtros visibles: rotación, tipo de secuencia, colocador y calidad de recepción.
6. Despliega **Más filtros** si necesitas tempo, atacante, combinación, llamada K o tipo F/C/B/P/S.
7. **Limpiar filtros** restablece la selección local de Distribution sin modificar el scouting.

## 3. Distribución consecutiva

La matriz presenta las seis rotaciones (P1–P6) y, si es necesario, las de rotación desconocida. Cada tarjeta muestra el número de colocaciones E, ataques posteriores A, porcentaje de kills y eficacia de los ataques evaluados. Las jugadas aparecen en orden cronológico por set, rally y contacto.

Debajo están las **dos tablas**:

- **Resumen por rotación**: P1–P6, cantidad de E y A, ataques evaluados, kills (#), errores (=), bloqueos (/), Kill% y EFF.
- **Registro consecutivo**: set/rally, rotación, fase, valoración R, colocador, llamada K, destino E, tempo E, atacante, origen A, valoración del ataque, marcador conocido y botones de revisión.

Los porcentajes son **Kill = ataques `#` / ataques evaluados** y **EFF = (`#` − `=` − `/`) / ataques evaluados**. Cuando no existe denominador válido, se muestra `—`, no 0%.

**Rally** selecciona la jugada original. **Vídeo** abre la sección Video Analysis y selecciona ese rally; la reproducción real requiere tener el vídeo asociado y disponible en el dispositivo.

## 4. Llamadas del colocador

La sección compara las llamadas K almacenadas en la acción E. Incluye una tabla de llamadas (E, porcentaje, ataques y EFF), una pista por origen A o destino E, y cinco opciones ofensivas F/C/B/P/S únicamente cuando existen códigos compatibles.

Las **matrices añadidas** permiten comparar:

- **Llamadas × zona de ataque**: llamadas K en filas, zonas Z4, Z3, Z2, Z5, Z6 y Z1 en columnas. Cada celda contiene cantidad y porcentaje de los casos con origen registrado de esa llamada.
- **Llamadas × atacante**: llamadas K por jugador asociado al siguiente ataque comprobable.

Seleccionar una llamada K o una zona aplica filtros en toda la sección. Para limpiar, utiliza **Limpiar filtros**.

La pista es un **mapa de frecuencias**, no el movimiento físico del balón, el colocador ni el central. Cuando una secuencia no tiene zona o llamada, no se dibuja artificialmente.

## 5. Revisión desde vídeo

1. Selecciona un rally o localiza su fila en **Registro consecutivo**.
2. Pulsa **Vídeo** en esa fila o en la lista lateral.
3. Volley Coach abre **Video Analysis** manteniendo seleccionado el rally real.
4. Si no hay grabación vinculada, la pantalla indicará la ausencia de vídeo; el análisis estadístico no crea archivos nuevos.
5. Para corregir datos, utiliza **Scouting Editor Pro**, guarda y vuelve a cargar el análisis.

## 6. Exportación

Pulsa **Exportar secuencias CSV**. Exporta los contactos filtrados, no inventa acciones, y protege los campos de texto frente a fórmulas activas al abrir la hoja de cálculo. La exportación es de datos, no de un vídeo ni de una imagen.

## 7. Instalación segura

- Si estás en **V19.3.16.1 completa**, aplica el ZIP **Solo cambios V19.3.16.3** conservando las rutas.
- Si llegaste a **V19.3.16.2 con el ZIP completo anterior**, utiliza **V19.3.16.3 COMPLETO**: aquel ZIP se había generado desde una base más antigua y carecía de los módulos 196–198.
- Antes de actualizar, **exporta y conserva copias de los scoutings de cada dispositivo**.
- Espera a que GitHub Pages publique los cambios y recarga las páginas. La versión del recurso CSS/JS y la caché del service worker se han renovado.
- Comprueba los dos dispositivos antes de dar por válida la sincronización. Un indicador «nube sincronizada» no demuestra por sí solo que los rallies y el vídeo coincidan.

## 8. Qué está validado y qué falta

Las pruebas unitarias validan el motor, filtros, asociaciones, tablas y preservación de datos; Chromium aislado valida el diseño y el enlace hacia Video Analysis con un reproductor simulado. **No se ha probado un partido real completo con Supabase, vídeo físico y dos dispositivos simultáneos**.

Persisten referencias a 11 CSS ausentes desde la base antigua. Esta versión añade estilos específicos de Distribution y una maquetación básica de respaldo dentro de `index.html` para evitar que la nueva pantalla se rompa si su CSS no carga, pero no reconstruye los otros estilos de origen que faltan.

Documentación externa comparativa: https://www.dataproject.com/Products/EU/en/Volleyball/DataVolley4
