# Volley Coach V20.7.13 · Consultas tácticas fuera del núcleo

## Qué hemos separado

Tras migrar las vistas HTML en V20.7.12, ahora se trasladan **28 funciones
de lectura y cálculo** desde `021-core-scouting-v150-monolithic.js` al
módulo `011-v5115-pdf-rosters-script.js`, que ya se carga antes de Scouting.

Se mantiene el nombre público de todas las funciones en el núcleo mediante
adaptadores de compatibilidad que pasan sus dependencias actuales. El módulo
`011` exporta solamente las funciones de consulta mediante
`window.VC_SCOUT_ANALYSIS_QUERY_20713`.

### Funciones por área

- **Tendencias V6.4 (8):** agrupación de rallies, distribución del
  colocador, candidatos, filtros de distribución y ataque, agrupaciones,
  avisos de muestra y selección de rallies para detalle.
- **Histórico de rivales V6.5 (9):** agrupación de oponentes, ataques,
  candidatos de jugadores, filtros, rotaciones, plantillas y detalle.
- **Cruces V6.7 (11):** selección de rallies, cálculos por cruce,
  métricas, clasificación de celdas, patrones de ataque, confianza,
  mejores/peores cruces, resúmenes y códigos.

No hay modificaciones en el escritor de puntuación, Deshacer, IndexedDB,
Supabase, diarios locales, edición de rallies ni vídeo.

## Resultado medido frente a V20.7.12

| Recurso | Cambio en bytes originales | Cambio gzip nivel 9 |
| --- | ---: | ---: |
| Núcleo de Scouting `021` | **−8.796** | **−1.842** |
| Módulo de análisis `011` | +18.219 | +3.232 |
| `index.html` | +539 | +135 |
| **Total de estos tres recursos** | **+9.962** | **+1.525** |

**Interpretación:** el núcleo se reduce y las responsabilidades se separan,
pero esta etapa todavía aumenta ligeramente el peso comprimido total.
No se añade ningún archivo JavaScript activo ni ninguna solicitud adicional.
Quedan pendientes compactación, sustitución progresiva del código clásico
y eliminación auditada de recursos redundantes.

## Garantías automatizadas

1. Los cuerpos originales de las 28 funciones se reconstruyen desde el
   módulo nuevo y se comprueba su SHA-256 conjunto congelado en V20.7.12.
2. Se comparan los resultados antiguo/nuevo con datos vacíos y con ejemplos
   de rallies, agrupaciones, ataques y rotaciones; los parámetros no cambian.
3. Se comprueban orden de carga, revisión de la caché offline y presencia
   de los escritores nativos.
4. Se ejecutan los tests de la arquitectura anterior y la auditoría de assets.

La interfaz real publicada y la sincronización entre dos dispositivos
**siguen necesitando una revisión manual**.

## Publicación incremental en GitHub

1. **Base obligatoria:** V20.7.12 aplicada.
2. Descomprime **V20.7.13 SOLO_CAMBIOS**.
3. Sube **solo los archivos del ZIP** a la raíz del repositorio, manteniendo
   las rutas y reemplazando las versiones anteriores de esos archivos.
4. **No borres ninguno** de los **41 candidatos históricos** identificados.
   Se retirarán juntos cuando la migración completa haya sido verificada.
5. El ZIP de Vite es una opción para un sistema de publicación diferente.
   **No lo subas por separado** si sigues la subida habitual `SOLO_CAMBIOS`.

## Qué sigue

Las próximas fases deben consolidar las rutas de lectura restantes, reducir
los acoplamientos entre presentación y datos, optimizar el peso transferido
y validar la app publicada con Scouting, Match Mode, análisis táctico,
video Live/Delay, puntos, Deshacer, guardado offline y Supabase.
