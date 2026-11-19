# Volley Coach V20.5.32 · Borrador de código rápido en TypeScript

**Actualización incremental sobre V20.5.31.** Esta fase migra una parte real del flujo de entrada de Scouting Speed Pro, sin cambiar aún el registrador de acciones nativo.

## Qué funciona ahora desde TypeScript

- Reconocimiento del prefijo de equipo, dorsal, fundamento, valoración y sufijos del borrador.
- Botones de fundamento y valoración del panel «Scouting Speed Pro».
- Atajo de valoración siguiente/anterior y recuperación de códigos previos.
- Conservación de los sufijos avanzados y de los códigos parciales que admite el editor histórico.
- Comparación de **cada resultado** con la implementación clásica antes de devolverlo. Si el módulo no se ha cargado, falla o devuelve un valor distinto, se utiliza el comportamiento anterior.

El módulo TypeScript no registra ni valida definitivamente jugadas, no concede puntos, no cambia rotaciones, no guarda datos locales y no envía nada a la nube. El campo de código del scouting sigue enviando las acciones al registrador original cuando el usuario pulsa **Añadir** o **Enter**.

## Dónde verlo

1. Abre **Scouting → Scoutar** y selecciona un partido en curso.
2. Abre el modo **Código directo** o **Vídeo + scouting**.
3. En el panel **SCOUTING SPEED PRO**, debajo del título, aparecerá «Borrador TypeScript (comprobación de equivalencia)» si el módulo cargó; en caso contrario, «Borrador clásico (respaldo)».
4. Selecciona un dorsal, pulsa un fundamento y una valoración. El código queda en el campo de entrada **sin registrar acciones**. Pulsa Añadir o Enter solo cuando quieras confirmar.
5. Comprueba el atajo `Alt + .`, «Repetir último código» y «Deshacer borrador»; este último deshace el texto editado, **no** un punto del marcador.

## Publicación

- **V20.5.31 ya instalada:** sube a la raíz del repositorio el contenido de `Volley_Coach_V20.5.32_SOLO_CAMBIOS.zip`, sobrescribiendo los archivos coincidentes y conservando las carpetas `src/` y `scripts/`.
- **Instalación completa de código:** usa `Volley_Coach_V20.5.32_COMPLETO.zip`, excluidos `node_modules` y compilados temporales.
- **Publicación de la web compilada:** usa únicamente el contenido de `Volley_Coach_V20.5.32_PUBLICACION_VITE.zip`. No lo mezcles con el código fuente.

## Pruebas de seguridad y pendiente

La suite automatizada comprueba paridad de códigos válidos, parciales y fallidos, defensa ante una implementación TypeScript defectuosa, edición y deshacer del borrador, ausencia de mutaciones en partidas, y hashes de los dos ficheros del estado canónico.

**Pendiente antes de reemplazar el registrador:** contrastar en un partido real los cambios de saque, rotaciones, líbero, puntuación y recuperación/deshacer, con pruebas en dos dispositivos y sin conexión. Las pruebas actuales no afirman equivalencia funcional completa con Data Volley 4.
