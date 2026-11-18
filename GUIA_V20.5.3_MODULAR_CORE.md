# Volley Coach · V20.5.3 · Modular Core (primera integración)

## Qué cambia

Se activa el **primer consumidor real basado en módulos ES6** dentro de la aplicación. Los módulos se importan entre sí y leen el partido ya mantenido por `MatchState`/el puente de scouting existente:

- `vc2052-match-contract.mjs`: proyección pura de los rallies y comprobación de trazas de puntuación explícitas.
- `vc2053-match-reader.mjs`: adaptador de solo lectura al partido canónico; escucha `MatchState.subscribe`, eventos `vc:matchstatechange` y retorno a la pestaña. Fusiona los avisos repetidos en una actualización por microtarea, sin sondeo permanente.
- `vc2053-modular-core.mjs`: primera vista real de esta proyección. Incluye indicador discreto en el espacio de partido y un diagnóstico completo en Gestión.
- `vc2053-modular-core.css`: estilos ligeros sin modificar el marcador, la pista ni el vídeo.

**No se cambia el motor de escritura, la puntuación, los comandos, IndexedDB, las copias o la sincronización Supabase.** Sigue existiendo una sola fuente de verdad. Tampoco se ha sustituido el sistema histórico por una SPA completa o por Vite; esta versión inicia la migración en un límite seguro.

## Dónde verlo

1. Abrir Volley Coach actualizado y entrar en **Gestión**.
2. Buscar **“Núcleo modular ES6” (V20.5.3)**, justo después de “Diagnóstico técnico del navegador” V20.5.2. Si no hay scouting seleccionado aparece “Sin partido seleccionado”.
3. Abrir un partido desde Scouting y volver a Gestión: se muestran número de sets, rallies cerrados, acciones cerradas y trazas de puntuación verificadas/sin datos.
4. Pulsar **“Comprobar conexión del módulo”** si se desea releer el estado actual. No escribe datos.
5. En el espacio de partido, al lado de la navegación del Match Workspace, aparece un discreto distintivo **“ES6 conectado · N rallies”**.

Una “traza sin datos” significa que al rally le falta resultado o puntuación antes/después en el formato necesario para la comprobación. No indica corrupción ni permite inferir quién ganó.

## Instalación en GitHub

Subir los archivos del ZIP **SOLO CAMBIOS** en la raíz del repositorio, conservando nombres y estructura; **sobrescribir únicamente** `index.html` y `service-worker.js`. El ZIP **COMPLETO** representa una instalación nueva, con el resto del programa incluido.

Los tres archivos `.mjs` deben subirse tal cual. El Service Worker incorpora soporte de caché de estos módulos e incrementa su versión a 20.5.3. Tras publicar, hacer recarga completa de la página si sigue cargando la anterior versión.

## Verificación

```bash
node --test vc2052-foundation.test.cjs vc2053-modular-core.test.cjs
node --check service-worker.js
node --check vc2053-match-reader.mjs
node --check vc2053-modular-core.mjs
```

Probar manualmente: sin partido, con partido, al cerrar un rally, al cambiar de partido y tras recargar sin red (con recursos ya precargados). La caché de la interfaz no garantiza por sí sola sincronización ni uso total sin conexión.

## Siguiente paso

Migrar una **operación completa y aislada** a un módulo de dominio con pruebas de equivalencia y rollback, antes de intervenir el registrador en vivo. Medir latencia y errores en partidos reales antes de retirar envoltorios antiguos.
