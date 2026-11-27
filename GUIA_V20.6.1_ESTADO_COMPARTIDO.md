# Volley Coach V20.6.1 — Estado compartido entre Scouting, Análisis y Vídeo

## Qué se ha migrado

Continuación de la reestructuración mayor V20.6.0. Se incorpora un **contrato de lectura en TypeScript** (`src/state/shared-match-context.ts`) y un puente al motor canónico (`src/state/shared-match-context-runtime.ts`). No guarda partidos, no reconstruye un segundo modelo y no es un sistema alternativo de puntuación.

- `VC_MATCH_CONTEXT_2061.getActive()` obtiene la referencia exacta del partido desde el lector existente `MatchState` y los respaldos anteriores.
- `getSet(match)` devuelve exclusivamente un set que pertenece al objeto del partido solicitado; rechaza lectores que apunten a otro partido.
- `capture(match,set)` expone un comprobante pequeño de identidad y valores del estado actual: set, marcador, saque, rotaciones, fase, rallies y acciones abiertas. El envoltorio es inmutable, **pero el partido original no se congela ni se clona**.
- `current(antes,después)` detecta cambios para impedir lecturas desfasadas en futuras fases de migración.
- `selectAnalysisMatch()` representa la preferencia histórica: partido seleccionado, partido activo, primer partido.

## Conexiones reales

1. **Scouting LIVE:** las estadísticas de set y el boxscore de jugadores leen el mismo objeto canónico mediante `readSharedMatch`; los paneles tienen respaldo nativo y no escriben.
2. **Análisis:** `scoutMatchForAnalysis()` consulta el selector TypeScript, lo compara con el resultado efectivo del selector original y lo usa **solo si es la misma referencia**.
3. **Vídeo en directo:** el módulo V7.40 consulta el partido y set comunes, manteniendo las funciones originales cuando el resultado no sea exactamente el mismo objeto. No se modifican controles REC, Delay, reproductor, tiempos ni fuentes.

## Garantías

- Un único dueño del estado del partido: el `MatchState` ya existente.
- Un único escritor nativo de acciones, puntos, rotaciones y Deshacer.
- Fallback al código original ante un puente ausente, incompatible, que falla o devuelve una selección distinta.
- Ningún cambio de esquema de datos, migración de registros, recreación de IndexedDB ni intervención en CAS/Supabase.
- Sin clonado de `sets`, `rallies`, acciones, identidad de partido ni metadatos de vídeo.

## Archivos a usar

- `Volley_Coach_V20.6.1_COMPLETO.zip`: fuente completa V20.6.1.
- `Volley_Coach_V20.6.1_SOLO_CAMBIOS.zip`: diferencia incremental **desde V20.6.0**. No debe superponerse a una versión más antigua.
- `Volley_Coach_V20.6.1_PUBLICACION_VITE.zip`: contenido de `dist/` compilado para publicar; no incluye fuentes ni pruebas.

## Pruebas y límite de validación

La batería automatizada comprueba referencias, prioridades de selección, fallos del puente, discrepancias con Análisis/Vídeo, cambios de marcador/set y regresiones anteriores. Las pruebas automatizadas **no sustituyen** la validación manual con un navegador real, dos dispositivos conectados, grabación REC/Delay ni una operación real de Supabase.

La reestructuración completa continúa: este bloque consolida **lecturas**; la consolidación restante de módulos históricos y las verificaciones en dispositivos requieren fases posteriores.
