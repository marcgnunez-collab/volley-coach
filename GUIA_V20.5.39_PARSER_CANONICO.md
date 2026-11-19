# Volley Coach V20.5.39 · Parser de extensiones consolidado

**Base de actualización: V20.5.38.**

## Qué se ha consolidado

Se han retirado dos reasignaciones activas del parser `scoutV6108ParseRaw`. Las extensiones históricas que se aplicaban por tres envoltorios sucesivos pasan por **un único envoltorio**, manteniendo sus fases y el mismo orden:

1. Identificar destino por cono (V8.8) y preparar el código sin la localización del cono.
2. Extraer modificadores avanzados de colocación, tempo y tipo (V8.7).
3. Interpretar subzonas A/B/C/D (V8.6).
4. Ejecutar una sola vez el parser clásico V8.4 de las acciones.
5. Restaurar subzonas y metadatos avanzados; finalmente, restaurar el cono cuando exista.

Las tres lecturas de sintaxis siguen delegando en los módulos TypeScript de V20.5.38 con comprobación de equivalencia frente a los selectores nativos y respaldo automático.

## Qué NO cambia

- Los formatos actuales de comandos y sus errores.
- El dorsal, el jugador, el fundamento, la valoración, las zonas, tempos y códigos especiales.
- El escritor de acciones, el marcador, la rotación, el deshacer de rallies, el vídeo y los metadatos.
- IndexedDB, Supabase y la recuperación CAS/diario de sincronización.
- La posibilidad de reabrir o editar scouting usando la función del editor.

**El parser general aún no está 100 % modernizado.** Persisten las capas históricas V8.3 y V8.4, junto a la resolución nativa de jugadores y el código que escribe el scouting.

## Dónde verlo

En **Scouting → Scoutar → Scouting Speed Pro** encontrarás:

**«Parser de extensiones único · TypeScript»** cuando el bundle esté disponible.

Si TypeScript no está preparado, aparecerá **«Parser único · extensiones nativas»**. La estructura consolidada sigue siendo válida y el lector histórico funciona como respaldo.

## Comprobaciones y límites

La entrega incluye el fixture original de los tres envoltorios V20.5.38 en `test-audit/fixtures/v20538-parser-extensions.txt`. Las pruebas comprueban salidas idénticas, mensajes de error, corrección con `oldAction`, número de normalizaciones y comportamiento cuando los módulos TypeScript fallan.

La comparación local ha cubierto 1.501 entradas sintéticas y acciones antes de cerrar el cambio. No certifica sincronización real de nube, grabación de vídeo ni el funcionamiento del navegador en una competición.

## Instalación en GitHub

| ZIP | Para qué sirve |
| --- | --- |
| `Volley_Coach_V20.5.39_SOLO_CAMBIOS.zip` | Actualizar desde V20.5.38. Descomprimir y añadir/sustituir su contenido desde la raíz del repositorio. |
| `Volley_Coach_V20.5.39_COMPLETO.zip` | Reconstruir el proyecto desde todos los archivos fuente. |
| `Volley_Coach_V20.5.39_PUBLICACION_VITE.zip` | Distribución optimizada de Vite, si publicas directamente la carpeta compilada. |

No subas los ZIP sin descomprimir como archivos de la web. Tras publicar, fuerza una recarga del navegador y comprueba el panel de archivos de **Gestión**.

Antes de utilizarla en un partido oficial, prueba en un scouting temporal con códigos de ataque en subzonas, una acción a cono, colocación con tempo, un error de código, edición/deshacer y sincronización en dos dispositivos.
