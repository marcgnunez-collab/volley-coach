# Volley Coach V20.5.41 · Construcción de acciones de Scouting con TypeScript

**Actualización sobre V20.5.40.**

## Qué se ha migrado

El parser base delega tres operaciones puras en `src/domain/scout-action-builder.ts`:

1. **Construcción del borrador de acción:** copia los datos existentes de una acción editada y añade equipo, fundamento, evaluación, zonas y modificadores.
2. **Campos del jugador propio:** conserva la identidad encontrada por el buscador nativo (dorsal, nombre y referencia).
3. **Campos del jugador rival:** conserva la etiqueta devuelta por el buscador nativo y la representación histórica de nombre/dorsal.

El nuevo módulo **no busca jugadores, no registra rallies y no escribe puntos**. El parser clásico continúa obteniendo los datos de las plantillas, llama al motor de inferencia y normalización original y entrega una sola acción al escritor existente.

## Seguridad y equivalencia

- Cada resultado TypeScript se compara con un borrador clásico de referencia mediante las claves y valores originales, incluyendo las referencias de objetos previamente guardados.
- Si el módulo no está cargado, falla, devuelve un objeto incorrecto o la comparación no coincide, se utiliza el resultado clásico.
- No se vuelven a consultar las plantillas ni se registra una segunda acción.
- Los diagnósticos locales solo mantienen contadores anónimos de coincidencias, discrepancias y fallos.
- Se conserva el vídeo de una acción editada (tiempos y procedencia), sus metadatos tácticos y la información previa.

La comparación añade trabajo temporal mientras se verifica la equivalencia. **Esta entrega es una migración de arquitectura y no una optimización de velocidad certificada.**

## Qué sigue siendo histórico

- Consulta de jugador propio y rival en sus respectivas plantillas.
- Inferencia de zona de origen/contacto y normalización final del evento.
- Creación del código visible, escritura del rally, cálculo del marcador, deshacer, vídeo y sincronización.

## Dónde verlo

En **Scouting → Scoutar → Scouting Speed Pro** aparecerá:

**«Construcción y jugadores TypeScript · escritura nativa»**.

Si el módulo TypeScript no está disponible, la acción se construye mediante la ruta anterior. La aplicación no depende de una conexión a internet para utilizar esa ruta.

## Publicación en GitHub

| ZIP | Uso |
| --- | --- |
| `Volley_Coach_V20.5.41_SOLO_CAMBIOS.zip` | Recomendado con V20.5.40 instalada. Descomprimir y subir su contenido a la raíz de GitHub manteniendo las carpetas. |
| `Volley_Coach_V20.5.41_COMPLETO.zip` | Todo el código fuente. |
| `Volley_Coach_V20.5.41_PUBLICACION_VITE.zip` | Distribución compilada con Vite. |

No subas los archivos ZIP sin descomprimir como ficheros de la web. Después de publicar, fuerza la recarga y revisa **Gestión → Comprobación del sistema**.

## Ensayo de funcionamiento recomendado

En un partido de prueba:

1. Introduce varios códigos válidos propios y rivales, con y sin zonas.
2. Corrige un scouting antiguo con un dorsal que ya no aparezca en la plantilla, y comprueba que se conserva la referencia de la acción previa cuando corresponda.
3. Comprueba que solo se crea una acción por código y que el marcador y las rotaciones siguen siendo correctos.
4. Comprueba los metadatos de vídeo, la edición, deshacer, las estadísticas y la sincronización en dos dispositivos.

Las pruebas automatizadas comparan el parser actual con la implementación real V20.5.40 guardada en `test-audit/fixtures/v20540-base-parser.txt`. No sustituyen una validación de partido real con conexión a nube ni un ensayo completo de vídeo.
