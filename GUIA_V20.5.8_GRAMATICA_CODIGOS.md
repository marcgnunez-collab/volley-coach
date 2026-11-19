# Volley Coach · V20.5.8 · Gramática modular de códigos rápidos

## Resultado de esta fase

Se ha ampliado el inspector TypeScript para reconocer de forma **estructural** los modificadores y zonas que existen en los parsers originales de Volley Coach. Se ha contrastado una selección de códigos reales de prueba con la cadena histórica de interpretación (V6.10.8, V8.3, V8.4, V8.6, V8.7 y V8.8), utilizando dobles únicamente para la plantilla y otros servicios ajenos a la sintaxis.

**No se sustituye `v680ParseCode`**: durante el partido el parser y el registrador existentes mantienen toda la autoridad. La gramática TypeScript ayuda a identificar qué sintaxis podrá migrarse en fases posteriores, sin escribir acciones ni confirmar un marcador.

## Dónde se ve

1. Publica la actualización y recarga la web, dejando que el Service Worker actualice los archivos.
2. Entra en **Gestión** y busca el panel **«Referencia de código rápido» · V20.5.8**, después de «Auditoría del scouting registrado».
3. Escribe un código de prueba y pulsa **«Comprobar estructura»** (también puedes usar Intro).
4. Se mostrarán el fundamento, evaluación, zonas y modificadores reconocidos. El mensaje **«Estructura reconocida» no significa que el jugador exista ni que se haya registrado la jugada**.

También se beneficia el diagnóstico de V20.5.6 y la auditoría V20.5.7: cuando una sintaxis pasa de «no cubierta» a «candidata» podrán cotejar sus campos básicos. La auditoría de V20.5.7 sigue ejecutándose **solo a petición del usuario**, sin explorar el partido en cada pulsación.

## Sintaxis estructural reconocida

| Parte | Ejemplo | Significado |
| --- | --- | --- |
| Encabezado | `7A#`, `R12S=` | Dorsal, fundamento, evaluación y equipo (`R` inicial = rival). |
| Contacto | `7R#.6`, `6D+.5` | Zona única de recepción/defensa; representa el contacto. |
| Trayectoria | `12A#.4B>5D` | Origen y destino con subzonas A/B/C/D. |
| Cono de ataque | `12A#.4B>C5` | Origen y destino por cono C1–C8, solo para ataque. |
| Tipo de saque | `4S+.1>5~JF` | `JF`, `JP`, `F` o `U`. |
| Dirección de ataque | `12A#.4>5*DC` | `LIN`, `DC` o `DL`. |
| Combinación | `12A#:PIPE` | `Z4`, `Z2`, `Z1`, `Z6`, `1T`, `31`, `BACK`, `PIPE`, `2T`, `OTR`. |
| Llamada detallada | `7E+::31` | Código personalizado alfanumérico corto; sin certificar su semántica táctica. |
| Tempo | `12A#~T`, `7E+~Q` | Valores admitidos `Q`, `U`, `T`, `M`, `H`, `O` en ataque/colocación. |
| Fase | `12A#^K1` | `K1`, `K2`, `FB`, `TR`. |
| Bloqueadores | `12A#@2` | `0` a `3`. |
| Objetivo de bloqueo | `3B#.4&12` | Dorsal objetivo de hasta tres dígitos. |
| Otros metadatos | `%RAP`, `|F`, `?X`, `$Y` | Subtipo, tipo de colocación, especial y personalizado. |

El inspector acepta esos modificadores en diferentes órdenes, siempre que sean individuales, sus valores estén dentro de los formatos conocidos y las zonas sean coherentes. Rechaza sufijos desconocidos, repetidos o fuera de rango como **«no cubiertos»** sin intervenir en el parser original.

**Limitaciones importantes:**

- No convierte una línea de rally completa tipo `*12S# .04R+ *10A#` en varias acciones. El prefijo `*` de DV4 no está habilitado como comando de Volley Coach.
- No importa ni exporta `.dvw` por esta vía.
- No comprueba jugadores existentes, restricciones de líbero, sustituciones, puntuación oficial, rotaciones reales ni confirmación en otro dispositivo.
- Algunas secuencias que el parser histórico tolera, pero que no tienen un significado fiable en el modelo tipado, seguirán etiquetadas conservadoramente como no cubiertas.
- Las pruebas de equivalencia sintáctica no equivalen a una validación manual de partido ni de vídeo.

## Archivos de SOLO CAMBIOS

| Ruta | Función |
| --- | --- |
| `src/domain/code-grammar.ts` | Gramática tipada ampliada, zonas, conos y 12 familias de modificadores. |
| `src/domain/grammar-runtime.ts` | Panel interactivo de prueba en Gestión, sin escrituras. |
| `src/vc2055-entry.ts` | Exporta y monta el nuevo módulo ES6. |
| `vc2055-domain-core.mjs` | Compilado generado por Vite, **obligatorio para GitHub Pages desde la raíz**. |
| `vc2055-domain.css` | Estilos del panel. |
| `index.html`, `service-worker.js` | Referencias versionadas y nueva caché PWA. |
| `package.json`, `package-lock.json` | Versión 20.5.8 y pruebas. |
| `vc2055-domain.test.cjs`, `vc2056-shadow-validation.test.cjs`, `vc2057-committed-audit.test.cjs`, `vc2058-code-grammar.test.cjs` | Regresiones y corpus de ejemplos del parser histórico. |
| `README.md`, `GUIA_V20.5.8_GRAMATICA_CODIGOS.md` | Documento de instalación y alcance. |

## Instalar en tu GitHub

La entrega incremental requiere tener instalada **V20.5.7**.

1. Descarga y descomprime `Volley_Coach_V20.5.8_SOLO_CAMBIOS.zip`.
2. Abre [marcgnunez-collab/volley-coach](https://github.com/marcgnunez-collab/volley-coach).
3. Sube **todos** los archivos del ZIP a la **raíz de la rama desde la que GitHub Pages publica**, conservando las carpetas `src/` y `src/domain/`. Sobrescribe únicamente los archivos con el mismo nombre.
4. **No borres ningún archivo histórico, partida, imagen, CSS ni vídeo.** No cargues el ZIP comprimido directamente como recurso de la página: hay que subir su contenido descomprimido.
5. Asegúrate de subir `vc2055-domain-core.mjs`. GitHub Pages **no ejecuta** TypeScript ni Vite por su cuenta.

`COMPLETO` reúne el proyecto fuente. `PUBLICACION_VITE` es una distribución compilada **independiente para pruebas**; no mezcles sus archivos con `SOLO CAMBIOS` en el despliegue actual.

## Reproducir las comprobaciones

```bash
npm ci
npm run typecheck
npm run build
npm run test:foundation
```

También se mantienen las pruebas históricas de sincronización, recuperación, CAS y diario IndexedDB. Sigue pendiente probar con un partido real, deshacer, vídeo, y dos dispositivos después de publicar la versión.

## Siguiente bloque

**V20.5.9 · Estado centralizado observable y migración de scripts críticos:** trazar suscripciones entre marcador, pista y estadísticas, consolidar componentes concretos y retirar parches únicamente después de pruebas de equivalencia. La reestructuración completa todavía no está terminada.
