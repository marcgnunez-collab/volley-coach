# Volley Coach V20.5.44 · Preparación de registro unificada

**Actualización incremental sobre V20.5.43.** Esta entrega es la primera parte de la consolidación del registro de acciones. No sustituye todavía el estado completo del partido ni el escritor histórico.

## Qué cambia

Se han eliminado tres envoltorios consecutivos de `scoutPushAction` dentro del núcleo `021-core-scouting-v150-monolithic.js`:

1. **V8.4 — bloqueo:** inferir el dorsal del atacante rival cuando no se ha indicado.
2. **V8.3 — recepción:** conservar el tipo de saque recibido, la zona de origen y la referencia a su acción.
3. **V6.10.8 — recepción y defensa:** preparar origen, destino, contacto y la inferencia contextual de la acción precedente.

Ahora estas decisiones se ejecutan en una **única capa de preparación**, conservando su orden y llamando **una sola vez** al escritor nativo que ya existía. La nueva función pura `prepareContactRegistration` en `src/domain/scout-action-registration.ts` calcula las zonas de recepción y defensa; la ruta efectiva compara sus cinco campos con la función original y vuelve automáticamente al cálculo nativo si falta el módulo, falla o discrepa.

Se mantienen en el núcleo existente la inferencia contextual a partir del rally, el perfil del rival, la normalización final, el guardado, el vídeo y los eventos de actualización. Los envoltorios externos de vídeo, editor e informes **no se han eliminado**.

## Cómo comprobarlo

En **Scouting → Scoutar → Scouting Speed Pro** debe aparecer:

**«Preparación de registro unificada · TypeScript · escritura nativa».**

Los contadores técnicos anónimos están disponibles en `VC_SCOUT_REGISTRATION_DIAGNOSTICS_20544()`; indican coincidencias, uso del respaldo nativo y discrepancias sin incluir jugadas ni datos privados.

## Verificación y precauciones

- `test-audit/fixtures/v20543-registration-wrappers.txt` conserva las tres funciones envoltorio de la versión anterior para comprobar su comportamiento.
- Pruebas comparativas para recepción, defensa, bloqueos, saques, ataques, inferencias desde acciones previas, formatos de zona, metadatos de vídeo, fallos de guardado y fallos del módulo TypeScript.
- No se añade un segundo `scoutPushAction`, ni se altera el escritor original `scoutSave`.
- **No se modifican el marcador, rotaciones, cambios, deshacer, recuperación IndexedDB, CAS/Supabase, vídeo LIVE/Delay ni exportaciones.**
- Esta entrega reduce deuda técnica, pero no demuestra que el registro sea más rápido: mientras se verifica la equivalencia, los dos cálculos puros se comparan.

Antes de competir, probar el flujo completo: registrar saque, recepción, ataque y bloqueo, corregir una jugada, deshacer un rally, revisar su vídeo y comprobar desde un segundo dispositivo que la nube recibe los cambios. Las pruebas automatizadas no equivalen a ese ensayo real.

## Qué falta para una arquitectura definitiva

Todavía quedan envoltorios de terceros archivos para marcas de vídeo, estadísticas e informes, además de la lógica de escritura y estado dentro del monolito. En las próximas versiones se consolidarán individualmente con pruebas de paridad; no se eliminarán de golpe.

## Publicar en GitHub

| Paquete | Uso |
| --- | --- |
| `Volley_Coach_V20.5.44_SOLO_CAMBIOS.zip` | Para pasar de V20.5.43 a V20.5.44. |
| `Volley_Coach_V20.5.44_COMPLETO.zip` | Código completo con fuentes TypeScript y pruebas. |
| `Volley_Coach_V20.5.44_PUBLICACION_VITE.zip` | Distribución compilada para el alojamiento de la web. |

Descomprime el ZIP elegido, respeta las rutas y sube los **archivos sueltos**, no el ZIP. No borres otros archivos del repositorio. Haz una copia de seguridad de datos y configuración antes de reemplazar los archivos, y fuerza una recarga tras publicar.
