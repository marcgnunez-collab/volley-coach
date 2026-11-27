# Volley Coach V20.7.9 · Auxiliares de informes fuera del núcleo Scouting

## Qué cambia

Se trasladan **26 funciones de cálculo y presentación exclusivamente de informes** desde `021-core-scouting-v150-monolithic.js` al módulo PDF ya activo
`011-v5115-pdf-rosters-script.js`. Incluyen:

- Métricas por jugador, habilidades y fases para el informe oficial (familia `v757`).
- Agrupaciones de recepción, colocación, ataque y tempos (familia `v890Pdf`).
- Cobertura e integridad de datos mostrados en los informes profesionales (familia `v961`).

El script de Scouting pasa de **705.674 a 690.443 bytes**, una reducción de
**15.231 bytes** en su núcleo. El script PDF aumenta por alojar las funciones
completas, y **no hay una petición de red ni un archivo de ejecución adicionales**.

En tamaño comprimido gzip de ambas fuentes, pasamos de **193.465 a
193.666 bytes**, es decir, **201 bytes más**. Es una reorganización arquitectónica,
no todavía un ahorro de transferencia total.

## Cómo se ha protegido el comportamiento

1. El código de las 26 funciones originales se traslada **sin modificar sus
   cuerpos**. Se compara el SHA-256 del conjunto con el código anterior.
2. La generación se hace bajo demanda y las dependencias se obtienen del
   Scouting actual en ese momento; se mantiene el equipo activo.
3. Se compara el resultado de los informes oficial y multipágina con el
   algoritmo anterior, tanto sin rallies como con un rally cerrado que contiene
   distintas acciones.
4. Se comprueba que la generación no altera el partido de ejemplo.
5. Se conserva el orden de carga: módulo PDF antes de Scouting.
6. No se cambia ningún escritor de puntos, Deshacer, alineaciones, CSV,
   IndexedDB, Supabase, sincronización ni vídeo.

Las pruebas automatizadas no sustituyen la validación manual en la app real.
Después de publicar revisa el informe PDF oficial, el profesional multipágina,
las pestañas de análisis, el contador de puntos y Deshacer.

## Subida incremental a GitHub

1. Base: **V20.7.8** ya aplicada.
2. Descarga el ZIP **V20.7.9 SOLO_CAMBIOS**.
3. Sube exclusivamente sus archivos a la raíz de GitHub, conservando
   subcarpetas y sobrescribiendo los nombres repetidos.
4. **No borres ningún archivo existente en GitHub.**
5. El ZIP de Vite es opcional para otro procedimiento de publicación;
   **no lo subas aparte** si utilizas los ZIP incrementales habituales.

El inventario sigue registrando **37 candidatos antiguos** para una única
limpieza final, cuando se hayan verificado todos los recorridos de la app,
la nube y dos dispositivos.

## Próximo trabajo

La gran migración todavía no está cerrada. Siguen pendientes la reorganización
de otras vistas y consultas de Scouting, la comprobación real de los flujos
de datos en GitHub y el retiro cuidadosamente auditado de los archivos
históricos. Ninguno debe eliminarse antes de esa verificación.
