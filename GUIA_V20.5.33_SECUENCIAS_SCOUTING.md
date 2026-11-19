# Volley Coach V20.5.33 · Comprobador de secuencias de Scouting

**Actualización incremental sobre V20.5.32.** En esta fase se añade una inspección orientativa de varios códigos de un mismo rally, sin tocar el registrador de acciones, el marcador ni la sincronización.

## Dónde está

1. Abre **Scouting → Scoutar** y entra en el espacio de trabajo del partido.
2. En **SCOUTING SPEED PRO**, despliega **«Comprobar secuencia de rally · experimental · solo lectura»**.
3. Escribe los contactos separados por espacios, por ejemplo: `*12S+ .04R+ *10A#`.
4. Pulsa **Comprobar secuencia** o Enter mientras estás dentro de ese campo.

`*` significa equipo propio y `.` rival. Se admiten también los prefijos del Scouting histórico (`12S+ R04R+ 10A#`). El analizador **no copia automáticamente** estos contactos al editor de scouting: su uso es exclusivamente de comprobación.

## Qué revisa

- Código estructurado, dorsal, fundamento, valoración y sufijos reconocidos.
- Ausencia de una valoración explícita.
- Contactos posteriores a un posible punto ya terminado, por ejemplo `*12S# .04R+`.
- Posibles dobles contactos del mismo dorsal sin bloqueo intermedio.
- Atribución del saque y recepción al mismo equipo.
- Máximos: 512 caracteres y 32 contactos por consulta, para mantener la interfaz ligera.

**Advertencias, no sanciones automáticas:** no consulta rotaciones reales, alineaciones, condición de líbero, sustituciones, arbitraje ni normas específicas de la competición. Puede aceptar una estructura que el parser original rechace o señalar para revisión una jugada legítima. El motor antiguo sigue teniendo la última palabra.

## Qué archivos subir

- Si ya publicaste **V20.5.32**: descarga `Volley_Coach_V20.5.33_SOLO_CAMBIOS.zip`, extrae el contenido y súbelo a la raíz de `volley-coach`, sobrescribiendo los coincidentes sin borrar los demás.
- Si necesitas todos los fuentes: `Volley_Coach_V20.5.33_COMPLETO.zip`.
- Si publicas únicamente la página estática compilada: usa `Volley_Coach_V20.5.33_PUBLICACION_VITE.zip`, sin mezclarlo con los paquetes de fuentes.

## Pruebas recomendadas tras subirlo

1. Abre un partido en directo y comprueba que el panel «Comprobar secuencia» está **cerrado por defecto** y no quita espacio al vídeo.
2. Comprueba `*12S+ .04R+ *10A#` (estructura reconocida) y `*12S# .04R+ *10A#` (aviso por ace con contactos posteriores).
3. Introduce un código mal formado; asegúrate de que solo muestra mensajes, sin alterar marcador ni acciones guardadas.
4. Comprueba que el código directo, las macros, la pista, vídeo y nube siguen funcionando, tanto en ordenador como en móvil.

No hay todavía una validación completa del formato .dvw ni un motor de reglas certificado. Estas capacidades quedan para fases posteriores de la migración.
