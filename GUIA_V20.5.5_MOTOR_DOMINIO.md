# Volley Coach · V20.5.5 · Motor de dominio modular (primera fase)

## Qué se ha construido

El primer conjunto **reutilizable y comprobable de reglas de voleibol en TypeScript**, compilado por Vite a `vc2055-domain-core.mjs` y conectado a una vista de solo lectura en Gestión.

| Módulo TypeScript | Funciones |
| --- | --- |
| `src/domain/model.ts` | Tipos y validación de datos explícitos. |
| `src/domain/code-grammar.ts` | Inspección estructural de códigos rápidos; **no** sustituye al parser original ni valida dorsales. |
| `src/domain/scoring.ts` | Verificación estricta de las trazas de puntuación de cada rally. |
| `src/domain/rotation.ts` | Secuencia R1–R6 y proyección hipotética de recuperación de saque. |
| `src/domain/substitutions.ts` | Comprobaciones básicas de duplicación de jugadores, posición y líbero. **No evalúa límites reglamentarios oficiales.** |
| `src/domain/statistics.ts` | Eficiencia de ataque, Side-Out y Break Point utilizando únicamente resultados explícitos. |
| `src/domain/runtime.ts` | Vista en Gestión y acceso público de solo lectura. |
| `src/vc2055-entry.ts` | Entrada del paquete ES6 y exportación de las funciones. |

El registrador (`v857AddCode`), `scoutAwardPoint`, las rotaciones reales, la corrección de rallies, el vídeo, IndexedDB, el escritor CAS y Supabase **no se sustituyen ni se interceptan**. El nuevo motor comprueba y calcula sin escribir.

## Dónde verlo

1. Abre Volley Coach y entra en **Gestión**.
2. Busca **“Reglas TypeScript · diagnóstico” (V20.5.5)**, a continuación del “Núcleo modular ES6”.
3. Abre un partido con rallies guardados y vuelve a Gestión. Pulsa **“Comprobar reglas”**.
4. Podrás consultar las trazas de puntuación verificadas, inconsistentes y desconocidas; la etiqueta de rotación y una estimación de Side-Out, Break Point y eficiencia de ataque basada en los datos guardados.

El estado “sin datos” no significa que el partido tenga errores. Una inconsistencia aparece únicamente si existen tanto los marcadores antes/después como el ganador y no encajan entre sí. Los porcentajes excluyen las jugadas cuyo resultado o saque no pueda identificarse: no deben interpretarse como informes certificados sin cotejarlos con el scouting.

La sintaxis de un código se clasifica como **“candidata”**, nunca como código aceptado hasta que lo valide el parser nativo. Los controles de sustitución son estructurales, no una certificación de cumplimiento del reglamento FIVB o de una competición concreta.

## Instalación de SOLO CAMBIOS en GitHub

1. Tener previamente V20.5.4.
2. Descomprimir `Volley_Coach_V20.5.5_SOLO_CAMBIOS.zip`.
3. Subir **todos los archivos y conservar las carpetas `src/domain/`, `src/` y `scripts/`** en la raíz del repositorio.
4. Sobrescribir los archivos existentes que acompañan la actualización: `index.html`, `service-worker.js`, `package.json`, `package-lock.json`, `.gitignore` y `vc2054-vite-foundation.test.cjs`.
5. Los demás archivos de la entrega son nuevos. No borrar scripts históricos, datos, imágenes o bibliotecas anteriores.

El archivo `vc2055-domain-core.mjs` **sí debe subirse**: es la versión ES6 generada y permite que GitHub Pages la ejecute sin necesitar Node en el servidor. Una subida de solo `.ts` no activa el módulo.

## Desarrollo y compilación reproducibles

```bash
npm ci
npm run typecheck
npm run build:domain
npm run build
npm run test:foundation
```

`build:domain` utiliza `vite.domain.config.mjs` para producir un paquete independiente, y copia mecánicamente ese archivo al nombre estable del módulo público. `build` ejecuta primero este paso y después construye la web en `dist/`.

## Qué se ha comprobado

- Paridad de las rotaciones R1–R6 en ambos sentidos con `scoutV6107NextRotation` del código histórico.
- Paridad de la fórmula básica de eficiencia de ataque con `scoutV640Eff`.
- Equivalencia de trazas de puntuación con el contrato read-only V20.5.2.
- Casos conocidos de sintaxis, subzonas, conos y errores de gramática.
- Casos de inconsistencias locales de sustitución sin afirmar su legalidad oficial.
- Montaje de Gestión, suscripción y liberación de listeners.
- Regresión de sincronización, diario y compatibilidad existente mediante las pruebas automáticas.

No se han probado con dos dispositivos reales ni con un partido en vivo en esta entrega. Realizar esas pruebas antes de sustituir el registrador original.

## Publicación Vite

Hay un ZIP opcional con `dist/` compilado para pruebas de publicación. **No mezclarlo con el ZIP de cambios** ni modificar la fuente activa de GitHub Pages sin una validación previa de vídeo, scouting y nube. El despliegue habitual desde el código fuente continúa siendo compatible.

## Próximo bloque

V20.5.6 · Validación paralela en el flujo de scouting: cotejar de forma no intrusiva los resultados del parser nativo y del dominio modular con un registro de discrepancias descargable, antes de sustituir ningún comando de partido.
