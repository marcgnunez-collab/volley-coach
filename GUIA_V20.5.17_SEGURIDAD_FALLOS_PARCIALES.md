# Volley Coach V20.5.17 · Seguridad ante fallos parciales del motor nativo

## Alcance

Esta entrega continúa **la fase de estructura y pruebas de integración**. La migración total a módulos ES6 aún no está finalizada. El piloto transaccional sigue **sin conectarse a los botones reales**, al teclado rápido, al vídeo o a Supabase.

La nueva comprobación está en `src/domain/rally-transaction-pilot.ts`. No aparece como un botón nuevo en Gestión: es una protección diagnóstica para la futura activación del coordinador.

## Problema encontrado

La implementación original de `window.scoutAwardPoint` y `window.scoutUndoRally` puede:

1. Modificar el marcador, el rally, las rotaciones o las alineaciones **en memoria**.
2. Invocar `scoutSave()` al final.
3. Sufrir un error de guardado después de los cambios en memoria.

Por tanto, **un comando rechazado no implica necesariamente que la operación no haya modificado el partido**. Tampoco demuestra que sus cambios se hayan guardado de forma duradera ni sincronizado en otro dispositivo.

## Solución de esta fase

El piloto `createRallyTransactionPilot(port)`, solo cuando un consumidor de pruebas lo utiliza expresamente:

1. Fotografía **antes del comando** únicamente una muestra del set activo y el rally en curso (marcador, saque, rotaciones, cierre de set/partido, acciones, alineaciones, líbero y marcadores de vídeo).
2. Llama **una sola vez** al escritor nativo que le proporciona el consumidor.
3. Si el escritor lanza un error o devuelve `false`, vuelve a inspeccionar los mismos campos.
4. Si detecta cambios, incrementa `report().partialMutations` y agrega sus categorías a `recent`.
5. Si no puede inspeccionarlos, incrementa `report().uninspectedFailures` e identifica el hallazgo como `missing-data`.
6. Conserva **exactamente** el error o el valor `false` original. No reintenta, no revierte y no sustituye el guardado histórico.

Los diagnósticos contienen categorías y contadores, **no** nombres de jugadoras, dorsales, códigos, identificadores de partidos ni enlaces a vídeos. La lista se limita a 40 incidencias.

**Importante:** la ausencia de `partialMutations` no es garantía de persistencia en IndexedDB ni de recepción por Supabase; solo indica que el comparador no observó cambios en los campos inspeccionados. Un error parcial requiere intervención consciente, no un deshacer automático.

## Pruebas de V20.5.17

El nuevo archivo `vc20517-native-safety-integration.test.cjs` aporta **11 pruebas**:

- La función real de punto extraída del monolito V15 modifica marcador, rotación y rally, y después falla al guardar.
- La función real de deshacer restaura el estado en memoria y después falla al guardar.
- Un punto de set cierra el set, pero el guardado posterior falla.
- El wrapper histórico V7.4 de vídeo vincula un clip y falla al guardar sus marcadores.
- Una devolución nativa `false` después de alterar alineación y vídeo se marca como operación parcialmente modificada.
- Un conflicto CAS simulado sin cambio local no genera una falsa alarma de modificación.
- Ausencia del lector y pérdida del lector después del error se registran como falta de evidencia.
- Tras un error, la cola FIFO sigue funcionando sin duplicar llamadas.
- Los informes se mantienen acotados y sin información personal.
- El paquete conserva los escritores originales y el piloto desconectado.

Validación local de esta entrega: **121 pruebas actuales** con TypeScript y Vite + **39 pruebas históricas** de sincronización, compatibilidad y recuperación = **160 pruebas automatizadas**. Auditoría estructural: **0 recursos referenciados ausentes y 0 imports de script duplicados**.

Las pruebas utilizan las **funciones originales extraídas del código fuente**, ejecutadas con servicios simulados en VM. **No son pruebas de red contra Supabase ni sustituyen un partido real en dos dispositivos.**

## Instalar en GitHub

Repositorio: https://github.com/marcgnunez-collab/volley-coach

### Si ya tienes V20.5.16: ZIP `SOLO_CAMBIOS`

1. Descarga y descomprime `Volley_Coach_V20.5.17_SOLO_CAMBIOS.zip`.
2. Copia **el contenido interior** de la carpeta descomprimida a la **raíz del repositorio**, manteniendo las subcarpetas `src/domain/`.
3. Confirma que se añade `vc20517-native-safety-integration.test.cjs` y esta guía; se actualizan el piloto TypeScript, `vc2055-domain-core.mjs`, `index.html`, `service-worker.js`, `package.json`, `package-lock.json`, `README.md` y las aserciones de pruebas incluidas.
4. Confirma los cambios en GitHub y espera la publicación.
5. Recarga Volley Coach cuando el nuevo service worker se haya activado. Si aún muestra la versión antigua, cierra y vuelve a abrir la aplicación.

**No elimines** `021-core-scouting-v150-monolithic.js`, los scripts numerados, `233-vc20512-match-state-core.js`, `234-vc20512-match-state-adapters.js`, el vídeo ni las reglas PWA; continúan siendo parte del motor activo.

### Si necesitas una copia nueva: ZIP `COMPLETO`

Incluye todo el código fuente y las pruebas históricas, sin `node_modules` ni carpetas transitorias de compilación. Antes de sustituir archivos, guarda cualquier cambio manual realizado en GitHub después de V20.5.16.

### Si publicas una web estática: ZIP `PUBLICACION_VITE`

Contiene el resultado `dist/` ya construido. Úsalo **solo** para el alojamiento de archivos estáticos correspondiente; no lo mezcles con el repositorio de desarrollo.

## Comprobaciones manuales necesarias

1. En Scouting, registra varios rallies y confirma marcador y rotaciones, con el teclado real.
2. Deshaz un rally que incluya líbero y cambios de alineación; comprueba la recuperación de acciones y vídeo.
3. Cierra un set y un partido, y verifica los bloqueos de edición posteriores.
4. En dos dispositivos reales, reproduce desconexión, subida, recepción, conflicto y reconexión sin duplicar rallies.
5. Antes de activar el piloto en producción, diseñar una recuperación específica para **escrituras inciertas** que no reviente el estado del usuario.

## Siguiente fase

Integrar estas evidencias con un **ensayo de recuperación tras caída de almacenamiento** y un protocolo de activación gradual del piloto. La reestructuración completa hacia una SPA modular con Vite sigue en curso: la prioridad es conservar intacto el motor que registra puntos y no crear una segunda ruta de escritura.
