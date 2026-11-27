# Volley Coach V20.7.7 · Scouting, primera limpieza controlada

## Resultado

El archivo de ejecución `021-core-scouting-v150-monolithic.js` pasa de
**749.211 a 729.913 bytes** (19.298 bytes menos). En las mediciones gzip de
ambas versiones pasa de **189.889 a 185.306 bytes** (4.583 menos).
**No se incorpora ningún nuevo archivo de ejecución**.

Se han retirado **ocho implementaciones de interfaz/exportación** que una
implementación posterior sustituía sin capturar ni consultar la anterior
durante el arranque. La auditoría de sintaxis identifica estas asignaciones
en el IIFE principal y verifica que las expresiones sustituidas no ejecutan
efectos al definirse. Permanecen las implementaciones vigentes y se conserva
expresamente la versión PDF que V7.5.7 captura para su informe histórico.

Las asignaciones de punto, deshacer rally, guardar alineaciones, añadir acciones,
crear partidos y el diario IndexedDB **no se han modificado**. Tampoco se toca
Supabase, sincronización, vídeo, Delay ni claves de almacenamiento.

Esta es la **primera reducción conservadora del monolito de Scouting**.
Quedan funciones dependientes unas de otras y escritores que requieren una
migración más profunda con pruebas sobre partidos reales.

## Cómo subir esta versión a GitHub

1. La base es **V20.7.6**. Descarga **V20.7.7 SOLO_CAMBIOS**.
2. Extrae el ZIP y sube a GitHub **solo su contenido** en las rutas indicadas,
   sustituyendo archivos del mismo nombre.
3. El ZIP incluye únicamente archivos **nuevos o modificados frente a V20.7.6**;
   los archivos que no cambian no están dentro. No se borra ningún archivo.
4. No tienes que publicar el paquete Vite aparte.
5. Espera a las comprobaciones de GitHub y verifica en escritorio y móvil que
   Scouting abre, puntúa, deshace, exporta CSV/PDF y muestra informes.

## Pruebas y transición futura

- Validación de sintaxis del núcleo reducido y conservación de las asignaciones
  de los escritores críticos.
- Batería completa TypeScript, Vite, tests de dominio y las pruebas históricas.
- Actualización de caché del service worker para no mezclar el archivo anterior.
- Simulación de instalación incremental sin borrar archivos, incluidos todos
  los paquetes `SOLO_CAMBIOS` desde V20.7.0.
- Las pruebas antiguas ya verifican el número de versión contra el manifiesto
  común; así no es necesario editar esos tests en cada nueva actualización.

**No borres nada de GitHub aún.** El inventario conservado para la limpieza
final sigue teniendo **37 candidatos**. El archivo
`021-core-scouting-v150-monolithic.js` se sigue utilizando y **NO** es uno
de los archivos que se pueden eliminar.
