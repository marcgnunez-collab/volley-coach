# Volley Coach V20.5.43 · Generador de códigos consolidado

**Actualización sobre V20.5.42.**

## Qué cambia

El formato de los códigos de scouting pasaba por cuatro generadores consecutivos: el V8.3 efectivo, y después tres envoltorios V8.4, V8.7 y V8.8. Ahora hay **un generador base y un único acabado final**:

1. Se preparan los bloqueos con su zona de contacto, como antes.
2. El código base V8.3 obtiene el dorsal nativo una sola vez.
3. Se incorpora el dorsal del jugador bloqueado, si lo hay.
4. Se agregan los códigos y modificadores DV (`::`, `~`, `%`, `|`, `?`, `$`).
5. Se incorpora el destino de ataque por cono, si procede.

`src/domain/scout-code-builder.ts` calcula los pasos puros; `src/domain/scout-code-builder-runtime.ts` instala el puente TypeScript/Vite. La función nativa final de `021-core-scouting-v150-monolithic.js` comprueba la equivalencia de entrada y salida y recupera el resultado nativo ante un error o discrepancia.

**No cambia la sintaxis:** los códigos existentes, incluidos `B#.3&12`, los sufijos de tempos y los conos `>C5`, siguen interpretándose igual.

## Dónde comprobarlo

En **Scouting → Scoutar → Scouting Speed Pro**, bajo «Extensiones», el indicador mostrará:

**«Parser único y generador de códigos único · TypeScript».**

Si falta el puente, se mantiene el generador nativo sin perder la capacidad de registrar acciones. El sistema permite consultar contadores técnicos, sin códigos privados ni información de jugadores, mediante `VC_SCOUT_CODE_BUILDER_DIAGNOSTICS_20543()`.

## Seguridad y pruebas

- Se conserva en `test-audit/fixtures/v20542-builder-wrappers.txt` el comportamiento anterior al cambio.
- La comparación automatizada recorre bloqueos, ataques, colocaciones, saques, recepción y defensa con distintos dorsales, evaluaciones, zonas, subzonas y destinos.
- Se verifica que no exista una segunda consulta de dorsal ni se dupliquen las llamadas al generador V8.3.
- No se modifican `scoutPushAction`, el marcador, las rotaciones, los metadatos de vídeo, IndexedDB, Supabase ni el diario de recuperación.

**Límite:** durante la fase de compatibilidad se calculan ambos acabados para comprobar su identidad. Esta versión reduce la deuda de arquitectura, pero no acredita por sí sola una mejora de rendimiento en partidos reales. Se recomienda probar una sesión completa (bloqueos, conos, edición, deshacer y sincronización) antes de usarla en competición.

## Instalación en GitHub

| Paquete | Cuándo utilizarlo |
| --- | --- |
| `Volley_Coach_V20.5.43_SOLO_CAMBIOS.zip` | Para actualizar una instalación V20.5.42; conservar las rutas al descomprimir. |
| `Volley_Coach_V20.5.43_COMPLETO.zip` | Código fuente completo listo para mantener en GitHub. |
| `Volley_Coach_V20.5.43_PUBLICACION_VITE.zip` | Ficheros compilados por Vite para publicar la web estática. |

Subir **los archivos descomprimidos** (con sus carpetas) y no el ZIP como un solo archivo del sitio. Tras publicar, recargar forzadamente, revisar **Gestión → Comprobación del sistema** y confirmar en Scouting que la etiqueta del generador indica TypeScript.
