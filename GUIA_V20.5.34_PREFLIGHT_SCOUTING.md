# Volley Coach V20.5.34 · Previsualización del scouting en TypeScript

**Base requerida: V20.5.33.** Este paso migra una operación real del flujo de Scouting Expert: la interpretación de la previsualización de un código después de recibir la respuesta del parser original.

## Qué cambia

- La previsualización de códigos en **Scouting → Scoutar → Código directo / Vídeo + scouting** obtiene su clasificación y mensajes desde una función pura TypeScript.
- La ejecución del parser nativo se conserva **una única vez** por cada previsualización que necesita comprobar el código.
- Antes de presentar el resultado, se compara la respuesta TypeScript con la clasificación clásica. Si falla o hay diferencia, la interfaz muestra exactamente el resultado clásico.
- Bajo el campo de código, una etiqueta discreta indica «TypeScript» o «Clásico».
- Los contadores de diagnóstico son exclusivamente numéricos: evaluaciones aceptadas, respaldo, diferencias, errores y llamadas al parser. No guardan dorsales, nombres ni códigos.

## Qué no cambia

El código rápido sigue registrándose con **Añadir** o Enter mediante el registrador original. No se han tocado el escritor de puntos, las rotaciones, el deshacer, los datos IndexedDB, el vídeo ni la sincronización Supabase. Tampoco se promete todavía validación oficial de .dvw ni aceptación de una secuencia entera en un solo comando.

## Instalación

- Si ya has publicado **V20.5.33**: descomprime `Volley_Coach_V20.5.34_SOLO_CAMBIOS.zip` y sube su **contenido** a la raíz de `volley-coach`, sobrescribiendo archivos coincidentes y conservando los demás.
- Para disponer del proyecto fuente completo: `Volley_Coach_V20.5.34_COMPLETO.zip` (sin `node_modules` ni carpetas de compilación).
- Para publicar solo los archivos web ya compilados: `Volley_Coach_V20.5.34_PUBLICACION_VITE.zip`. No se debe mezclar con los fuentes.

## Comprobación recomendada

1. Entra en un partido activo y escribe `7A#`, `R12S=`, un dorsal sin fundamento y un código inválido. Deben aparecer los estados habituales, ahora con etiqueta «TypeScript» si el módulo está cargado.
2. Comprueba que el módulo no aumenta la cantidad de acciones registradas al mostrar la previsualización.
3. Añade una acción deliberadamente con **Añadir** y verifica que el código, marcador, rotación y vídeo siguen su recorrido histórico.
4. Repite en un scouting finalizado, en móvil y en un partido con dos dispositivos conectados.

Las pruebas automatizadas contrastan todos los estados clásicos y fallos del parser, y garantizan que no se invoca dos veces el parser original. La prueba real de partido/nube y la migración de los escritores continúan pendientes.
