# Volley Coach V20.5.12 · Consolidación del núcleo de Scouting

## Qué se ha hecho

Esta es una **versión de arquitectura**, no una nueva pantalla ni una versión que cambie las reglas de puntuación.

1. Los dos scripts históricos de Scouting que estaban incrustados en `index.html` se han trasladado a archivos independientes:
   - `233-vc20512-match-state-core.js`: estado canónico V13.0, lectura del partido, selección, señales de cambio y protecciones de partidos finalizados.
   - `234-vc20512-match-state-adapters.js`: capa V13.1 de comandos de punto/deshacer, alineación, cambios, líbero, eventos y formularios profesionales.
2. **El contenido original de ambos scripts se ha conservado literalmente.** Solo se han reemplazado sus etiquetas por referencias a archivos JavaScript externos con la misma posición y carga clásica/síncrona.
3. Los lectores TypeScript de los diagnósticos, el estado observable, las estadísticas LIVE y el boxscore por jugador reutilizan ahora `src/state/match-state-contract.ts`. Este contrato declara los lectores existentes y la única ruta de lectura con alternativas en caso de fallo.
4. El service worker precarga los dos nuevos scripts y cambia su revisión para evitar cargar una mezcla de archivos antiguos y nuevos.

## Qué no cambia

- Los controles originales de anotación de punto, deshacer y corrección de rally.
- La escritura y la recuperación en IndexedDB, los mecanismos CAS y la sincronización Supabase.
- La interfaz de Scouting, la pista, las estadísticas ya añadidas, el vídeo y sus enlaces.
- Las funciones históricas de V13.0/V13.1: en esta entrega **se trasladan, pero no se reescriben**.

El proyecto **no está completamente modularizado**. El monolito principal de Scouting y numerosos wrappers siguen existiendo. Extraer estos dos scripts reduce el tamaño de HTML y permite analizarlos y migrarlos con controles de compatibilidad más precisos.

## Resultado medido

| Medida | V20.5.11 | V20.5.12 |
| --- | ---: | ---: |
| `index.html` | 1786,2 KiB | 1770,1 KiB |
| Scripts incrustados | 79 | 77 |
| Archivos JavaScript | 165 | 167 *(2 extraídos)* |
| Recursos referenciados ausentes | 0 | 0 |
| Importaciones duplicadas | 0 | 0 |

Los nuevos archivos JavaScript **no son nuevos parches**: contienen el código anterior que ya se ejecutaba desde HTML. La reducción de scripts incrustados es estructural; no debe confundirse con una eliminación de funciones antiguas.

## Instalación en GitHub

### A · ZIP «Solo cambios» (recomendado)

1. Comprueba que tienes instalada la **V20.5.11**.
2. Descarga **`Volley_Coach_V20.5.12_SOLO_CAMBIOS.zip`** y descomprímelo.
3. Copia los archivos a la raíz del repositorio [volley-coach](https://github.com/marcgnunez-collab/volley-coach), conservando las subcarpetas como `src/`.
4. **Es imprescindible añadir los dos archivos nuevos `233-vc20512-match-state-core.js` y `234-vc20512-match-state-adapters.js`.** Sin ellos, el estado de Scouting no arrancará correctamente.
5. Sustituye `index.html`, `service-worker.js`, `package.json`, `package-lock.json`, `README.md`, los archivos de prueba y los módulos TypeScript indicados en el ZIP. Incluye el `vc2055-domain-core.mjs` compilado, ya que la instalación estática lo necesita.
6. Publica y recarga cuando el nuevo service worker esté activo. **No borres** ningún otro script ni los datos del club.

**No cambies** las etiquetas de los dos nuevos scripts a `type="module"`, ni añadas `async` o `defer`: actualmente deben ejecutarse como scripts clásicos en el punto exacto de carga del HTML para mantener los adaptadores históricos.

### B · ZIP completo

**`Volley_Coach_V20.5.12_COMPLETO.zip`** contiene la base fuente actualizada, sin `node_modules` ni directorios de compilación temporales. Guarda antes tu propia copia si has modificado archivos localmente.

### C · Publicación Vite

**`Volley_Coach_V20.5.12_PUBLICACION_VITE.zip`** es la salida `dist/` para publicar como web estática. No mezcles la carpeta compilada con la carpeta fuente.

## Pruebas efectuadas

- **80 pruebas de base** aprobadas.
- **39 pruebas históricas** de sincronización y compatibilidad aprobadas.
- **119 pruebas en total.**
- Comparación de huellas SHA-256: el cuerpo de ambos scripts extraídos es idéntico al original de V20.5.11.
- Pruebas aisladas: punto, deshacer, bloqueo de escritura en partidos finalizados, selección/lectura del estado y continuidad de notificaciones.
- Auditoría: 0 recursos ausentes y 0 importaciones repetidas.

```bash
npm ci
npm run test:foundation
node --test test-audit/v2012-multi-device-validation.test.cjs test-audit/v2001-sync-engine-reliability.test.cjs test-audit/v2011-durable-sync-journal.test.cjs test-audit/v19320-compatibility-final-audit.test.cjs
node vc2052-architecture-audit.cjs
```

**Pendiente:** comprobar un partido completo y la sincronización entre dos dispositivos reales tras publicar. El navegador Chromium del entorno de desarrollo no está disponible por restricciones del sistema. La extracción equivalente y la batería automatizada no sustituyen esas pruebas.

## Prueba manual imprescindible

1. Abre un partido de pruebas o crea uno nuevo.
2. Registra una acción y un punto. Comprueba que el marcador y el turno de saque cambian como antes.
3. Deshaz el rally y confirma que se recuperan marcador, saque y rotación.
4. Revisa un partido finalizado: debe permanecer protegido contra nuevas anotaciones.
5. Abre **Scouting → Scoutar**, **Analizar** y **Gestión** y verifica que funcionan los paneles añadidos en V20.5.9–V20.5.11.
6. Cambia de partido y comprueba que no queda seleccionada información del anterior.
7. Comprueba que el móvil recibe el último estado confirmado y que los cambios offline siguen protegidos al volver la conexión.

## Siguiente paso de estructura

Migrar un subconjunto acotado y bien probado del motor de Scouting a TypeScript —por ejemplo, comandos y proyecciones de rallies cerrados— con una ruta de retorno al comportamiento anterior. La sustitución del escritor de puntos se hará **solo después** de contar con pruebas de equivalencia de marcador, rotación, undo, correcciones, CAS y uso en dos dispositivos.
