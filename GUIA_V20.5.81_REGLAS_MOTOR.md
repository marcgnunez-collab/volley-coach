# Volley Coach V20.5.81 · Migración de reglas del motor (fase 8)

## Cambio operativo

V20.5.81 empieza a introducir TypeScript **dentro del motor de puntuación nativo**, no solo en sus controladores. Los ayudantes que usa el escritor histórico para cerrar un set o rotar jugadores consultan ahora un núcleo de reglas tipadas:

| Cálculo | Regla que se conserva | Función TypeScript |
| --- | --- | --- |
| Objetivo del set | 25 puntos en sets 1–4; 15 en el quinto | `nativeSetTarget` |
| Finalización | Llegar al objetivo y tener ≥2 puntos de diferencia | `nativeSetHasWinner` |
| Sets ganados | Contar solo los sets terminados con ganador | `nativeCountWonSets` |
| Rotación | P1–P6, cambio cíclico de dirección, incluso sin líbero | `nativeRotateValues` |

Nuevos módulos:

- `src/domain/scout-native-score-rules.ts`: implementación pura de las cuatro reglas.
- `src/domain/scout-native-score-rules-runtime.ts`: puente inmutable `VC_NATIVE_SCORE_RULES_20581`.
- `src/vc2055-entry.ts`: instalación Vite y exportaciones tipadas.

Los puntos reales ya pasan por estas reglas: `scoutSetTarget`, `scoutSetHasWinner`, `scoutSetsScore`, `scoutRotateTeamLineup` y `vcRotateBase` mantienen su contrato original y llaman al nuevo núcleo cuando está instalado.

## Protección deliberada de los datos

Antes de aplicar cualquier resultado TypeScript, el ayudante comprueba que coincide exactamente con el cálculo histórico. Si difiere, el puente falla o no está disponible, se utiliza **el resultado histórico original**. Esta redundancia temporal permite validar una migración delicada sin dar una segunda vía de escritura a TypeScript. El coste de comparar seis posiciones y unas pocas puntuaciones es pequeño en relación con el procesamiento de un rally.

El escritor histórico sigue realizando todos los cambios de marcador, rotaciones, líberos, rallies, acciones, vídeo y guardado; los módulos TypeScript no modifican equipos ni persistencia. El controller V20.5.80 y el guard de comandos V20.5.79 siguen instalados.

## Verificación

```bash
npm ci
npm run test:foundation
node --test --test-reporter=spec test-audit/v19320-compatibility-final-audit.test.cjs test-audit/v2001-sync-engine-reliability.test.cjs test-audit/v2011-durable-sync-journal.test.cjs test-audit/v2012-multi-device-validation.test.cjs
```

`vc20581-native-scoring-rules.test.cjs` incluye más de mil combinaciones de puntuación, rotaciones en ambos sentidos, sets inconclusos y sin ganador, puentes incorrectos o caídos y llamadas reales a los escritores históricos de Punto y Deshacer con y sin TypeScript. La igualdad de estado se comprueba también tras cierres de set, un partido ganado por 3–0 y un Deshacer.

## Actualizar GitHub

- **SOLO_CAMBIOS**: superponer los archivos sobre el proyecto fuente V20.5.80. Añadir archivos nuevos; sustituir los existentes; no borrar otros módulos.
- **COMPLETO**: fuente íntegra con pruebas y guía. Ejecutar `npm ci` y `npm run test:foundation` si se mantiene el proyecto.
- **PUBLICACION_VITE**: publicar todo el contenido del ZIP en la raíz servida por GitHub Pages. No subir el proyecto fuente sin compilar como sustituto del paquete Vite.
- Conservar copia JSON de seguridad. Probar manualmente antes de operar: sets a 25/15, ventajas 25–25, ganador al tercer set, rotaciones del equipo y rival, líbero, vídeo/REC/Delay, desconexión y reconexión Supabase y Deshacer desde otro dispositivo.

No se han ejecutado pruebas manuales con dispositivos reales ni cambios en el esquema Supabase. Para volver a la versión anterior, restaurar los archivos de publicación V20.5.80, sin sustituir datos locales.
