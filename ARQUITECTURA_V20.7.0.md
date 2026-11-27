# Volley Coach · Mapa operativo de arquitectura V20.7.0

## Flujo en uso

1. **Entrada:** `index.html` carga los scripts clásicos en su secuencia histórica y el módulo publicado `vc2055-domain-core.mjs`.
2. **Coordinación TypeScript:** `src/vc2055-entry.ts` + `src/state/bootstrap-coordinator.ts` instalan adaptadores una sola vez y montan los paneles en DOM listo. No poseen el estado del partido.
3. **Scouting y partido:** el motor nativo actual conserva escritura de puntos, deshacer, rotaciones y acciones. Los módulos `src/domain/` calculan planes, validan comandos, normalizan acciones y comparan resultados; `src/state/shared-match-context.ts` y `shared-rally-timeline.ts` exponen lecturas comunes.
4. **Vídeo/Live/Delay:** los módulos clásicos conservan cámara, archivo de vídeo, REC, Delay y tiempo real. El historial compartido permite leer referencias, nunca sintetiza vídeo ni marcadores pasados.
5. **Persistencia y nube:** el estado principal y el diario durable usan sus contratos existentes; las réplicas IndexedDB tipadas de club/jugadores/entrenamientos tienen límites y confirmaciones específicos. Supabase CAS/Realtime no se reemplaza por el auditor de assets.
6. **Análisis:** normalizadores, consultas, índices, operaciones y exportación tipados en `src/state/` con adaptadores de compatibilidad sobre las pantallas históricas.
7. **Recursos:** `service-worker.js` gestiona caché de archivos públicos con red primero. `scripts/audit-runtime-assets.mjs` comprueba dependencias antes de `vite build`. Sin acceso a datos de usuario.

## Categorías de archivos: no confundir

| Tipo | Ubicación | Política |
| --- | --- | --- |
| Entrada web y motor histórico activo | `index.html`, `*.js`, `*.css`, iconos activos | Mantener hasta migrar y probar funcionalmente. |
| Dominio TypeScript | `src/domain/`, `src/state/` | Fuente modular nueva, empaquetada con Vite. |
| Archivo compilado para GitHub manual | `vc2055-domain-core.mjs` | Mantener; se sirve aunque el usuario no suba un ZIP Vite. |
| Compilación | `vite.config.mjs`, `vite.domain.config.mjs`, `scripts/`, `package*.json` | Mantener para compilación reproducible. |
| Pruebas y CI | `vc*.test.cjs`, `test-audit/`, `.github/workflows/` | Mantener para asegurar regresiones. |
| Histórico seguro de eliminar V20.7.0 | Lista `ELIMINAR_DE_GITHUB_V20.7.0.txt` | Retirado tras comprobar referencias/hashes. |

## Estrategia para acabar, sin perder datos

**Fase A — terminada:** migración tipada en paralelo de reglas de puntuación, historial y lectura compartida; coordinador único; diagnóstico seguro; limpieza de diez archivos raíz redundantes y auditoría de assets V20.7.0.

**Fase B — siguiente:** extraer scripts embebidos por dominios comenzando por módulos de interfaz de solo lectura. Requiere comprobar orden de arranque y elementos del DOM en Chromium.

**Fase C:** establecer la fuente autoritativa nueva por módulos de datos, una operación a la vez, con validación real de cierre forzoso de IndexedDB y recuperación.

**Fase D:** sustituir gradualmente los adaptadores clásicos de puntuación, vídeo y nube solo tras pruebas reproducibles con partido, REC/Delay y dos dispositivos reales, midiendo compatibilidad y rendimiento.

No borrar archivos por llevar un número de versión antiguo ni deshabilitar protección CAS para simplificar la arquitectura.
