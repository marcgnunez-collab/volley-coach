# Volley Coach V20.5.2 · Architecture & Performance Foundation

## Resultado de la auditoría estática

Sobre la base V20.5.1 recibida, el inventario reproducible detecta aproximadamente:

| Señal | Valor antes de V20.5.2 |
|---|---:|
| Tamaño del `index.html` | 1.784 KiB |
| Archivos JavaScript | 164 |
| Archivos CSS | 33 |
| Referencias a scripts externos | 158 |
| Scripts embebidos | 79 |
| Bloques CSS embebidos | 162 |
| Dependencias externas referenciadas ausentes | 0 |
| Referencias a JS duplicadas en HTML | 0 |

Se detectan numerosos patrones de capturas de funciones anteriores en el monolito de scouting. **Un patrón de código no demuestra por sí mismo una fuga de memoria o un fallo de rendimiento.** La auditoría localiza dónde comenzar la migración; no retira ni reemplaza funciones que pudieran tener consumidores históricos.

Para repetir el inventario sin instalar dependencias:

```
node vc2052-architecture-audit.cjs
node vc2052-architecture-audit.cjs --json
```

## Cambios de esta versión

1. **Inventario estático reproducible** (`vc2052-architecture-audit.cjs`): tamaños, scripts referenciados, CSS embebidos, ficheros ausentes, importaciones duplicadas y candidatos a envolturas de funciones.
2. **Diagnóstico del navegador** (`232-vc2052-architecture-foundation.js`): métricas de carga e instrumentación opcional de Long Tasks. Se consulta desde **Gestión → Diagnóstico técnico del navegador**, junto a Integridad de instalación. Permite descargar únicamente un JSON técnico despersonalizado.
3. **Contrato modular ES6 experimental** (`vc2052-match-contract.mjs`): proyección pura de los rallies y validación explícita de trazas de marcador, sin inferir puntuaciones, editar el partido ni conectarse a la nube. Este módulo **no se ejecuta todavía en producción**; prepara una migración verificable.
4. **Pruebas** (`vc2052-foundation.test.cjs`): inventario, privacidad del diagnóstico, carga de recursos y contrato de lectura.
5. **Service Worker**: nueva versión de caché, conservando la política anterior de red primero y exclusiones de Supabase.

## Arquitectura objetivo para próximas versiones

```
src/
  domain/        # Reglas de voleibol, eventos, acciones, cálculos puros
  application/   # Comandos: registrar, corregir, deshacer, cerrar rally
  adapters/      # Lectura/escritura de legado, vídeo, almacenamiento
  sync/          # Un único publicador CAS y diario durable
  ui/            # Vista Live, análisis, pista, banquillo, informes
  tests/         # Paridad de cálculos, datos y regresiones
```

El orden recomendado es: medir → congelar contratos de datos → extraer lectores puros → pruebas de paridad → trasladar selectores y componentes → migrar gradualmente operaciones de escritura. **No crear un segundo escritor**. Vite se incorporará cuando exista un conjunto modular mínimo con pruebas que sustituya una funcionalidad real del legado.

## Instalar desde V20.5.1

Descomprime `Volley_Coach_V20.5.2_SOLO_CAMBIOS.zip` y copia los archivos a la **raíz** de GitHub:

- `index.html` — sustituir
- `service-worker.js` — sustituir
- `232-vc2052-architecture-foundation.js` — añadir
- `vc2052-architecture-foundation.css` — añadir
- `vc2052-architecture-audit.cjs` — añadir
- `vc2052-match-contract.mjs` — añadir
- `vc2052-foundation.test.cjs` — añadir
- `GUIA_V20.5.2_ARCHITECTURE_FOUNDATION.md` — añadir

No elimines otros archivos ni modifiques Supabase. La versión completa conserva las rutas actuales y no ejecuta migración de datos.

## Pruebas en el navegador real

1. Abre **Gestión** y confirma que aparece **Diagnóstico técnico del navegador · V20.5.2**.
2. Pulsa **Medir ahora**, descarga el JSON y guarda una referencia. Repite tras recargar para comparar con un segundo arranque.
3. Abre un scouting de prueba, registra un contacto, cambia el marcador y consulta estadísticas y vídeo como antes.
4. Valida sincronización en dos dispositivos con la misma cuenta, incluyendo deshacer y reconectar.
5. Si un navegador no admite `PerformanceObserver`/Long Tasks, mostrará los indicadores disponibles sin afirmar que no hay bloqueos.

Esta V20.5.2 **no afirma reducir aún la latencia del motor ni reparar todas las envolturas**. Su objetivo es crear medición, contratos y un camino de refactorización seguro. La carga real y las métricas de dispositivo no pueden certificarse mediante pruebas estáticas.
