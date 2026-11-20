# Volley Coach V20.5.46 · Normalización central de acciones

**Actualización incremental sobre V20.5.45.** Seguimos extrayendo el motor de scouting a TypeScript sin crear otro almacenamiento, marcador o escritor.

## Qué se ha migrado

El normalizador base de acciones V6.8 prepara, entre otros, estos datos:

- Identificadores `id` y `seq`, equipo, dorsal propio/rival y etiquetas del jugador.
- Fundamento, evaluación, zonas, saque, fase, combinaciones, tempo y bloqueadores.
- Advertencias de validación, código de scouting y fecha/tiempo de registro.
- Referencia de tiempo y fuente de vídeo, conservando también cualquier campo histórico o personalizado.

`src/domain/scout-action-normalizer.ts` produce esa estructura como una proyección pura. La función nativa original sigue ejecutándose **una sola vez** para fijar el identificador y la fecha; la salida TypeScript recibe ambos valores y se compara campo a campo. En caso de que un campo no coincida, falle el módulo o haya propiedades con getters, se conserva el objeto nativo.

Se ha eliminado también un envoltorio duplicado V7.0 que volvía a normalizar `videoStart`, `videoAction`, `videoEnd` y `clipId` con la misma lógica de V6.9. Las demás capas de enriquecimiento siguen en su orden original.

## Relación con el estado único del partido

`readCanonicalLiveActions` amplía el contrato TypeScript de `MatchState` con un acceso **solo lectura** al mismo array de acciones del rally actual. No clona jugadas ni mantiene una segunda copia del partido. Los datos siguen residiendo en las estructuras nativas existentes.

## Qué permanece intacto

- `scoutPushAction`, `scoutSave`, el diario local IndexedDB y el sistema CAS de Supabase.
- Puntos, marcador, rotaciones, líberos, edición y deshacer.
- Sesiones REC, cámara móvil/portátil, timestamps y reproducción LIVE/Delay.
- Exportaciones, scoutings antiguos, código rápido y pista interactiva.
- La capa externa `024-v702-video-persistence-hotfix.js`, que conserva metadatos de vídeo en las estructuras guardadas.

## Dónde comprobarlo

En **Scouting → Scoutar → Scouting Speed Pro** debe aparecer:

**«Registro y normalización · TypeScript · escritura nativa».**

`VC_SCOUT_ACTION_NORMALIZER_DIAGNOSTICS_20546()` permite ver únicamente contadores agregados de cálculos tipados, respaldo clásico, discrepancias y excepciones. No contiene acciones ni información personal.

## Pruebas y límites

Los tests comparan la base V6.8 con cientos de combinaciones de fundamentos, evaluaciones, zonas, campos de vídeo y valores inválidos. También comparan la normalización con/sin el envoltorio V7.0 histórico, archivado en `test-audit/fixtures/v20545-duplicate-video-normalization.txt`, y verifican que solo se solicita un identificador y una marca temporal. La referencia al rally vivo mantiene su identidad original.

**Importante:** la extracción aún no convierte el monolito en una SPA completamente modular. Durante la comprobación de equivalencia, ambos cálculos de campos se ejecutan, así que no se garantiza una reducción de latencia. Antes de usar la nueva versión en competición, realiza una prueba real de scouting, vídeo, edición, deshacer y sincronización con dos dispositivos. Los tests locales no acreditan la recepción efectiva de datos en la nube.

## Instalación en GitHub

| Paquete | Uso |
| --- | --- |
| `Volley_Coach_V20.5.46_SOLO_CAMBIOS.zip` | Para actualizar desde V20.5.45. |
| `Volley_Coach_V20.5.46_COMPLETO.zip` | Proyecto completo con TypeScript, tests y guía. |
| `Volley_Coach_V20.5.46_PUBLICACION_VITE.zip` | Ficheros compilados para publicar la página. |

Descomprime el paquete, sube sus archivos respetando carpetas y sustituye los homónimos. **No borres otros archivos** del repositorio ni los datos guardados en tus dispositivos. Antes de actualizar, crea una copia JSON; después de publicar, fuerza una recarga con `Ctrl + F5`.
