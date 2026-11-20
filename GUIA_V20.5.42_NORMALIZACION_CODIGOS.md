# Volley Coach V20.5.42 · Normalización y códigos en TypeScript

**Actualización sobre V20.5.41.**

## Qué se ha migrado

### Zonas de contacto y origen

El módulo `src/domain/scout-code-format.ts` calcula los campos de recepción y defensa que el normalizador V6.10.8 necesita:

- `contactZone`: zona de contacto real de la recepción o defensa.
- `sourceZone`: origen conocido o inferido según la acción.
- `zoneInferred`: indicador de inferencia.
- `sourceActionId`: identificador de la acción asociada, si existe.
- Migración del campo de zona cuando hay una recepción/defensa antigua con una única zona.

El normalizador de acciones nativo continúa ejecutándose una sola vez. La decisión TypeScript debe coincidir campo por campo con el cálculo histórico antes de aplicarse.

### Generación del código visible

El mismo módulo construye el código de Scouting siguiendo la gramática **V8.3, que es la que realmente utiliza la aplicación** (la versión V6.10.8 había sido sobrescrita).

Incluye equipo, dorsal, fundamento, evaluación, origen/destino o contacto, tipo de saque, combinación, dirección de ataque, fase y bloqueadores.

- La consulta del dorsal real mediante `scoutPlayer` permanece nativa y se ejecuta **una vez**.
- El código generado en TypeScript se compara con el código original; si no coincide, se conserva este último.
- Los envoltorios posteriores de bloqueos, tempos, códigos especiales y conos siguen trabajando sobre ese código.

## Qué permanece intacto

- Consulta de jugadores y rivales, validación de códigos y registro de rallies.
- Normalización general de acciones ajena a los campos de contacto.
- Marcador, rotaciones, deshacer, vídeo y metadatos de clips.
- IndexedDB, Supabase y diario CAS de sincronización.

**Esta es una mejora estructural:** mientras dure la comparación, se realiza trabajo adicional de equivalencia por cada código; todavía no debe considerarse una optimización de latencia.

## Dónde verlo

En **Scouting → Scoutar → Scouting Speed Pro** aparecerá el indicador:

**«Sintaxis, contacto y código TypeScript»**.

Si el módulo TypeScript no está disponible, se usa el generador histórico de códigos y el normalizador nativo.

## Pruebas y límites

Se conserva una copia de las dos funciones originales V20.5.41 en `test-audit/fixtures/v20541-normalize-code.txt`. Las pruebas comparan la normalización y el código por skill, zona, subzona, evaluación, tipo de saque, combinación, dirección, fase y bloqueadores.

No se ha sustituido la escritura ni se garantiza la experiencia en un partido real solo con estas pruebas: se recomienda un ensayo de Scouting con vídeo, edición de rallies, deshacer y sincronización ordenador/móvil antes de competir.

## Instalación en GitHub

| ZIP | Cuándo usarlo |
| --- | --- |
| `Volley_Coach_V20.5.42_SOLO_CAMBIOS.zip` | Si tienes instalada V20.5.41: descomprimir y colocar su contenido en las mismas rutas de la raíz de GitHub. |
| `Volley_Coach_V20.5.42_COMPLETO.zip` | Proyecto completo con todos los archivos fuente. |
| `Volley_Coach_V20.5.42_PUBLICACION_VITE.zip` | Distribución compilada y optimizada de Vite. |

Sube el contenido de los ZIP descomprimido, **no el ZIP como un fichero de la página**. Tras publicar, fuerza una recarga y revisa la **Comprobación del sistema** en Gestión.
