# Volley Coach V20.6.0 · Migración mayor del núcleo de rally

## Por qué es una migración mayor

Se deja de añadir una versión por función auxiliar y se agrupa en un bloque de dominio el cálculo central del punto, la restauración de Deshacer y la numeración de rotaciones. El cambio está **dentro de los escritores realmente utilizados**, no en un panel experimental.

El nuevo núcleo es:

- `src/domain/scout-native-rally-plan.ts`: planes puros `planNativePoint`, `planNativeUndo` y `nativeNextRotationNo`.
- `src/domain/scout-native-rally-plan-runtime.ts`: puente de ejecución `VC_NATIVE_RALLY_PLAN_2060`, congelado y sin escritor propio.
- `src/vc2055-entry.ts`: instalación de la nueva vía en el arranque Vite.

La ruta de Punto **V6.10.7**, `021-core-scouting-v150-monolithic.js`, construye un plan TypeScript con los datos del set y de su snapshot previo. Si se comprueba la coincidencia campo a campo con el cálculo nativo, aplica ese plan para:

1. Incrementar exclusivamente el marcador del ganador.
2. Decidir quién pasa a sacar.
3. Decidir si debe rotar el equipo o el rival.
4. Establecer la numeración R1–R6 después de la rotación.

El escritor **original** sigue creando el registro real del rally, aplicando la rotación física y el líbero, manteniendo eventos, enlazando vídeo, comprobando el ganador del set y guardando el club. Los componentes V20.5.57 (registro tipado), V20.5.79 (guard del comando), V20.5.80 (controlador TypeScript) y V20.5.81 (reglas del set) siguen intactos y cooperan sin un segundo escritor.

La ruta nativa de Deshacer propone mediante TypeScript los cinco campos de restauración: puntuación propia/rival, equipo al saque y ambas numeraciones de rotación. Solo utiliza la propuesta si coincide exactamente con el snapshot histórico. La recuperación de alineaciones, líbero, acciones y metadatos de vídeo permanece en la cadena histórica.

## Comprobación de equivalencia antes de cada mutación

La salida TypeScript se compara con el resultado que habría producido el código original, incluyendo valores y direcciones de rotación. El plan es **atómico como cálculo, no como escritura distribuida**. Si no está instalado, arroja error o difiere, se conserva la ruta nativa original. Nunca se reintenta una operación que ya haya empezado a escribir.

Esto evita romper la sesión cuando el motor Vite todavía no está listo y mantiene una vía de reversión compatible con el diario local y CAS/Supabase. No es aún una migración completa del escritor autoritativo a TypeScript: esa sustitución necesita pruebas reales de vídeo/REC/Delay y dos dispositivos.

## Pruebas automáticas

```bash
npm ci
npm run test:foundation
node --test --test-reporter=spec test-audit/v19320-compatibility-final-audit.test.cjs test-audit/v2001-sync-engine-reliability.test.cjs test-audit/v2011-durable-sync-journal.test.cjs test-audit/v2012-multi-device-validation.test.cjs
```

`vc2060-native-rally-plan-migration.test.cjs` cubre miles de planes, rotaciones R1–R6, 96 escenarios del escritor efectivo con y sin puente tipado, equivalencia completa de estado tras Punto y Deshacer, y fallos/módulos defectuosos sin segundo guardado. Las pruebas anteriores verifican cobertura adicional de set, récord de rally, líbero, vídeo, journal y multi-dispositivo simulado.

## Cómo desplegar y recuperar

- `PUBLICACION_VITE`: subir **todos los archivos dentro del ZIP** a la raíz de GitHub Pages (sin carpeta envolvente), sobrescribiendo los existentes. No mezclar scripts de V20.6.0 con `index.html`/`service-worker.js` antiguos.
- `SOLO_CAMBIOS`: superponer sobre el **proyecto fuente V20.5.81**; no borrar el resto. Para la web pública hace falta compilar.
- `COMPLETO`: contiene todo el código fuente, pruebas y documentación; reconstruir con `npm ci` y `npm run build`.
- Antes de desplegar, exportar una copia JSON de seguridad del club. Validar manualmente sets a 25/15, diferencias de 2, marcador y Deshacer, rotaciones P1–P6, líbero, REC/Delay, vídeo histórico, reconexión y dos dispositivos con Supabase.
- Si algo falla, volver a publicar el ZIP V20.5.81 sin reemplazar la información local.

## Criterios objetivos para dar por terminada la reestructuración

1. Un solo propietario de cada operación mutadora: scouting, rally, vídeo, club y nube.
2. Vistas de Scouting, Análisis, Entrenamientos y Vídeo consumiendo el estado común, sin cálculos incompatibles.
3. Eliminación controlada de los adaptadores monolíticos redundantes solo después de pruebas de paridad en escenarios reales.
4. Recuperación probada después de error parcial, cierre de navegador y conflicto entre PC/móvil.
5. Validación manual end-to-end y despliegue reversible de GitHub Pages/Supabase.

Se recomienda completar lo restante en **bloques grandes de dominio**, no en una sucesión indefinida de versiones por función. Esta versión no modifica esquemas Supabase ni elimina archivos históricos. Las pruebas automatizadas no sustituyen la validación real.
