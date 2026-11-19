# Volley Coach V20.5.9 · Estado observable centralizado

## Qué se ha incorporado

1. **`src/state/match-observable.ts`** crea una proyección de solo lectura sobre el `MatchState` original. Consulta los campos necesarios para el marcador del set, el equipo al saque, las dos rotaciones, los rallies completados y las acciones del rally abierto.
2. **Suscripciones por tema** (`score`, `court`, `rally`, `status` y `change`). Los cambios iguales no vuelven a avisar a los consumidores específicos. Las dos señales habituales (`MatchState.subscribe` y `vc:matchstatechange`) se agrupan en una microtarea para no procesar dos veces el mismo cambio.
3. **Compatibilidad con correcciones históricas:** el tema `change` se publica también cuando se notifica un cambio pero los indicadores visibles no varían. Así, la auditoría de acciones confirmadas no conserva un informe antiguo tras corregir una jugada pasada.
4. **Menor duplicación de listeners:** los diagnósticos de dominio (V20.5.5) y acciones confirmadas (V20.5.7) escuchan la nueva capa cuando está presente. Mantienen su ruta original como alternativa si el módulo no se ha montado.
5. **Nuevo apartado Gestión → Lectura unificada del partido:** marcador, saque, rotaciones, rallies, acciones del rally y contador de actualizaciones selectivas. Incluye el botón «Actualizar lectura».

## Límites importantes

- Esta implementación **no sustituye** el objeto original `MatchState`, su motor de anotación, el marcador oficial, el deshacer, las sustituciones, el almacenamiento local ni la sincronización CAS/Supabase.
- No invoca `MatchState.getSnapshot()`, que duplica objetos grandes. Solo extrae datos simples y no recorre el historial completo de jugadas durante el evento de cambio.
- El tema `change` es una **notificación de invalidación**, no una garantía de que el partido haya cambiado: puede emitirse ante señales redundantes. Esto evita mostrar un informe de auditoría obsoleto.
- No se ha completado aún la migración de los scripts clásicos a módulos ES6 ni se ha sustituido la interfaz original por componentes reactivos.
- El contador de actualizaciones es diagnóstico del nuevo selector y **no es una medida de milisegundos de latencia**.

## Cómo instalar en GitHub

### Opción A · ZIP de solo cambios

1. Descarga **`Volley_Coach_V20.5.9_SOLO_CAMBIOS.zip`**.
2. Descomprímelo en tu copia del repositorio [volley-coach](https://github.com/marcgnunez-collab/volley-coach), manteniendo las carpetas internas `src/` y `scripts/` si aparecen.
3. Reemplaza los archivos que tengan el mismo nombre. **No borres** el resto de tus archivos del proyecto.
4. Verifica que `index.html` carga `vc2055-domain-core.mjs?v=20.5.9` y `vc2055-domain.css?v=20.5.9`.
5. Haz *commit* y publica mediante el flujo habitual. Si el navegador usa una versión anterior, recarga después de la activación del nuevo service worker.

El ZIP incluye el módulo `.mjs` ya generado para despliegues estáticos sin compilar TypeScript.

### Opción B · ZIP completo

**`Volley_Coach_V20.5.9_COMPLETO.zip`** incluye el proyecto actualizado, excluyendo dependencias instaladas y directorios de compilación temporales. Úsalo si necesitas reinstalar la versión completa. Haz una copia de tu código actual antes de sobrescribir una instalación que hayas modificado por tu cuenta.

### Opción C · Distribución construida con Vite

**`Volley_Coach_V20.5.9_PUBLICACION_VITE.zip`** contiene la salida de `npm run build` preparada para servir como web estática. No debes copiar su `dist/` sobre los archivos fuente; se publica como artefacto independiente.

## Comprobaciones técnicas

```bash
npm ci
npm run test:foundation
node --test test-audit/v2012-multi-device-validation.test.cjs test-audit/v2001-sync-engine-reliability.test.cjs test-audit/v2011-durable-sync-journal.test.cjs test-audit/v19320-compatibility-final-audit.test.cjs
node vc2052-architecture-audit.cjs
```

Resultado de esta versión: **61 pruebas de base y 39 históricas aprobadas**, sin referencias ausentes ni scripts importados dos veces. Las pruebas no sustituyen la validación manual en un móvil, un portátil y dos dispositivos sincronizando datos reales.

## Comprobación funcional recomendada (sin alterar datos)

1. Abre un partido y entra en **Gestión → Lectura unificada del partido**.
2. Comprueba que el set, el tanteo, el saque y las rotaciones coinciden con el marcador original.
3. Registra una jugada **en un partido de pruebas**, vuelve a Gestión y verifica que se ha actualizado la lectura.
4. Modifica una acción ya confirmada en el partido de pruebas y comprueba que el informe de **Auditoría del scouting registrado** indique que necesita nueva comprobación.
5. Repite la operación sin conexión y confirma después en el otro dispositivo la recuperación/sincronización a través del flujo existente.

## Próxima fase de la arquitectura

Migrar de forma gradual **un consumidor visual real** del estado observable (por ejemplo, un panel de estadísticas de solo lectura) antes de transferir la gestión de puntos y rotaciones desde los scripts originales. Cada migración debe contar con una comparación paralela frente al cálculo anterior, pruebas de deshacer y ensayos sin conexión.
