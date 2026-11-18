# Volley Coach V20.5.1 · Scouting Expert

## Alcance real

Primera fase de Scouting Expert sobre V20.5.0.3, centrada en **preparación y validación del código rápido**, no en sustituir el motor ni añadir un segundo escritor.

### Funciones nuevas

1. **Preflight del código directo y del vídeo + scouting**: cada campo de entrada tiene ahora un aviso compacto de estado.
2. **Un solo motor de interpretación**: después de reconocer dorsal/fundamento en el borrador, el módulo consulta `window.v680ParseCode`, el parser existente. La revisión no añade rallies ni contactos.
3. **Mensajes contextuales**: muestra equipo, dorsal, fundamento, valoración, origen/destino y errores que devuelve el motor; diferencia códigos parciales, completos y valoraciones omitidas.
4. **Sustitución nativa a mano**: acceso desde la banda Scouting Expert y atajo `Alt+Mayús+S` cuando el modo partido está activo y no se está escribiendo en otro formulario. Abre `v120OpenChanges`, si está disponible, sin tocar la alineación por sí mismo.
5. **Sin interferir en el registro**: Enter y Añadir siguen llamando a `v857AddCode` o `v113VideoAddCode` de la versión anterior. La revisión no bloquea ni sustituye esas acciones.

### Qué se conserva

- Pista, zonas/subzonas, teclado y macros V20.2.1.
- Marcador y rotaciones del partido.
- Historial de rallies, editor original, correcciones desde vídeo.
- Grabación/Delay/Live y sincronización nube con diario CAS.
- Scouting completo y de ambos equipos; la sintaxis final aceptada sigue dependiendo del parser original.

**No incluye todavía**: un rediseño del flujo de sustituciones, codificación nueva de combinaciones o una nueva tabla de estadísticas. Son bloques de posteriores versiones con pruebas propias.

## Subir a GitHub

Para actualizar desde V20.5.0.3, descomprime `Volley_Coach_V20.5.1_SOLO_CAMBIOS.zip` y sube a la raíz del repositorio:

- `index.html` (sustituir)
- `service-worker.js` (sustituir)
- `231-vc2051-scouting-expert.js` (añadir)
- `vc2051-scouting-expert.css` (añadir)
- `vc2051-scouting-expert.test.cjs` (añadir, pruebas)
- `GUIA_V20.5.1_SCOUTING_EXPERT.md` (esta guía)

No borres archivos ni modifiques Supabase.

## Verificación después de publicar

1. Crea un partido **de prueba** o usa uno no finalizado.
2. En código directo escribe `7A#` con un dorsal válido; el estado debe indicar si el parser lo acepta. Comprueba también una falta de dorsal real y un código incompleto.
3. Repite en el panel **Vídeo + scouting**. La validación debe verse junto al campo sin tapar el vídeo.
4. Registra una acción con Enter y confirma que el rally solo aumenta una vez.
5. Pulsa Sustitución; debe abrirse el panel original, sin registrar un cambio hasta que lo confirmes.
6. Revisa el marcador, la pista y la sincronización con otro dispositivo.

Las pruebas automatizadas confirman el comportamiento puro y la carga estática, pero no sustituyen un partido completo con el navegador y la nube reales. En caso de diseño desajustado, envía captura y conserva el ZIP anterior para volver a la presentación previa.
