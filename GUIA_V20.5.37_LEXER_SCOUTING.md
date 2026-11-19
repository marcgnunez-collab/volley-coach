# Volley Coach V20.5.37 · Lexer del código rápido en TypeScript

**Actualiza desde V20.5.36.** Esta entrega continúa la migración gradual del motor Scouting a módulos TypeScript compilados con Vite.

## Qué cambia

La lectura sintáctica básica de un código rápido pasa por `src/domain/scout-code-lexer.ts`:

- Equipo local/rival, dorsal, fundamento (`S/R/E/A/B/D/F/C`) y evaluación (`# + ! - / =`).
- Zonas base (`1–9`) y secuencias origen→destino.
- Modificadores tradicionales de saque (`~JF`, `~JP`, `~F`, `~U`), combinación (`:PIPE`, `:Z4`…), fase (`^K1`, `^K2`, `^FB`, `^TR`) y número de bloqueadores (`@0–3`).
- Códigos inválidos y mensajes de error del parser base.

El módulo **no** identifica jugadores, modifica partidos, suma puntos, escribe acciones o sincroniza. Esa responsabilidad sigue en el mismo registrador.

El código histórico verifica que los campos devueltos por TypeScript sean exactamente iguales a los del lector original. Si falta el bundle, el módulo falla o la lectura difiere, se usa automáticamente la interpretación nativa. Esto añade una pequeña comparación de sintaxis por código mientras se verifica la compatibilidad; aún no es una optimización de latencia.

## Qué permanece nativo

- Resolución de dorsal y plantilla; generación/normalización completa de acciones.
- Capas avanzadas de parser para subzonas A/B/C/D, conos, tipos de golpe, tempo y códigos de colocación.
- Registrador del rally, marcador, rotaciones, deshacer, vídeo y mecanismo CAS/diario de sincronización.

Por tanto, **la migración definitiva del parser no está cerrada**. Se ha migrado un núcleo léxico real y aislado, que servirá de base para ir retirando las cadenas históricas de modificaciones.

## Dónde comprobarlo

Abre **Scouting → Scoutar → Scouting Speed Pro**. Debe aparecer el texto:

**Sintaxis TypeScript · jugadores y escritura nativos**

Si ves **Sintaxis nativa (respaldo)**, el lector TypeScript no está activo y el código rápido sigue utilizando su lector tradicional.

## Publicación en GitHub

| Paquete | Uso |
| --- | --- |
| `Volley_Coach_V20.5.37_SOLO_CAMBIOS.zip` | Recomendado si ya tienes la versión V20.5.36: descomprimir y añadir/sustituir los archivos en su misma ruta, desde la raíz del repositorio. |
| `Volley_Coach_V20.5.37_COMPLETO.zip` | Archivos fuente completos. |
| `Volley_Coach_V20.5.37_PUBLICACION_VITE.zip` | Distribución compilada de producción Vite. |

No subas los ZIP como ficheros estáticos de la aplicación. Publica su **contenido**. Haz una recarga forzada tras la publicación y comprueba **Gestión → Comprobación del sistema** por si faltan archivos.

## Comprobaciones aconsejadas

1. Utiliza un **partido de prueba** y registra varios códigos en Scouting Speed Pro.
2. Prueba un código de saque, una recepción con zona simple, un ataque con origen→destino y códigos con modificadores.
3. Comprueba dorsal, valoración, zona, vídeo y marcador; un código debe crear una única acción.
4. Edita y deshaz un rally, y confirma que las estadísticas se recalculan.
5. Comprueba el flujo offline y la sincronización entre dos dispositivos de prueba antes de usar esta versión en competición.

## Validación automatizada

El proyecto incluye pruebas de equivalencia léxica con una matriz determinista superior a 20.000 combinaciones, pruebas de fallos/retorno a clásico, pruebas de integración del parser base y la batería general Vite/TypeScript e histórica. Estas pruebas no sustituyen un ensayo real con vídeo y sincronización de dos dispositivos.
