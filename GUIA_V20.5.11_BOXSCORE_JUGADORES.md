# Volley Coach V20.5.11 · Boxscore profesional de jugadores y rotaciones

## Dónde aparece

**Scouting → Analizar → Jugadores y rotaciones.** También hay un botón **«Boxscore por jugador»** dentro de Scouting → Scoutar → Estadísticas LIVE.

La nueva tabla convive con los análisis y los PDF anteriores; no los sustituye.

## Funcionalidades

1. **Filtro de equipo:** propio o rival.
2. **Filtro de periodo:** set actual o partido completo.
3. **Filtro de rotación:** todas o una de P1–P6. Para el equipo propio se usa `rotationBefore`; para el rival, `opponentRotationBefore` del rally confirmado.
4. **Boxscore individual:** dorsal, nombre registrado, saques/aces/errores, recepciones positivas y perfectas, ataques/puntos codificados/eficiencia, bloqueos, defensas y colocaciones.
5. **Tabla de seis rotaciones:** rallies examinados, Side-Out, Break Point y eficiencia de ataque del equipo seleccionado en cada rotación, para comparar P1–P6 sin cambiar de pantalla.
6. **Correcciones y deshacer:** se recalcula desde las acciones confirmadas del estado original cuando el estado observable emite un cambio.

## Definiciones

| Columna | Lectura |
| --- | --- |
| SAQ · #/= | Saques valorados; saques `#` y errores `=` |
| REC · +/# | Recepciones valoradas; porcentaje positivo (`+`/`#`) y perfecto (`#`) |
| ATA · K/EFF | Ataques valorados; acciones `A#` y eficiencia `(A# − A= − A/) / intentos` |
| BLQ · # | Bloqueos valorados y acciones `B#` |
| D/E | Defensas y colocaciones registradas |
| ACC. | Acciones evaluadas incluidas en la fila |
| SO · G/T | Rallies ganados recibiendo / rallies cerrados con saque rival y ganador conocido |
| BP · G/T | Rallies ganados al saque / rallies cerrados con saque propio y ganador conocido |

**Importante:** `A#`, `S#` o `B#` representan valoraciones **registradas**, no se utilizan para sumar puntos de partido ni para inventar un balance `+/-`. Los puntos y rotaciones oficiales siguen viniendo del motor original.

Los jugadores se agrupan por identificador estable si está disponible; se usa el dorsal como alternativa. Las acciones sin jugador reconocido se mantienen en el grupo **«Sin identificar»**. Si falta la rotación de un rally, sus acciones pueden aparecer en **Todas** pero no se atribuyen a P1–P6.

## Rendimiento y seguridad

- La tabla **solo se calcula cuando el área Analizar está visible** o cuando se pide explícitamente una nueva lectura.
- Una actualización del estado observable agrupa señales repetidas. No registra handlers alternativos de punto ni de deshacer.
- Se limitan las lecturas a **20.000 rallies y 60.000 acciones** y la visualización a **80 jugadores**. Si se alcanza un límite, aparece un aviso de resultados parciales.
- Los rallies abiertos no se contabilizan en esta tabla; el panel LIVE de V20.5.10 sigue mostrando su vista provisional por separado.
- No hay nuevos escritores, almacenamiento local adicional, modificaciones de IndexedDB, CAS/Supabase, vídeo, marcador ni sustituciones.

## Instalar en GitHub

### A · ZIP «Solo cambios» (recomendado)

1. Comprueba que ya tienes **V20.5.10**.
2. Descarga **`Volley_Coach_V20.5.11_SOLO_CAMBIOS.zip`** y descomprímelo.
3. Copia sus archivos al repositorio [volley-coach](https://github.com/marcgnunez-collab/volley-coach), **manteniendo intactas las rutas `src/` y el resto de subcarpetas**.
4. Sustituye los archivos coincidentes; añade los archivos nuevos. **No borres** los demás scripts ni los datos existentes.
5. Publica y recarga después de la activación del nuevo service worker.

La actualización incluye el archivo ES6 `.mjs` ya compilado para instalaciones estáticas. Los enlaces en `index.html` deben acabar en `?v=20.5.11`.

### B · ZIP completo

**`Volley_Coach_V20.5.11_COMPLETO.zip`** contiene toda la base actualizada, sin dependencias instaladas ni directorios temporales. Úsalo si necesitas restaurar la instalación; protege antes cualquier modificación propia no incluida.

### C · ZIP publicación Vite

**`Volley_Coach_V20.5.11_PUBLICACION_VITE.zip`** es la distribución estática generada mediante Vite. Se publica como una carpeta de distribución independiente, no mezclando sus archivos con el código fuente.

## Pruebas

```bash
npm ci
npm run test:foundation
node --test test-audit/v2012-multi-device-validation.test.cjs test-audit/v2001-sync-engine-reliability.test.cjs test-audit/v2011-durable-sync-journal.test.cjs test-audit/v19320-compatibility-final-audit.test.cjs
node vc2052-architecture-audit.cjs
```

**Resultado automatizado:** 73 pruebas de base y 39 pruebas históricas aprobadas (**112 en total**), sin referencias de interfaz ausentes ni imports duplicados. El resultado se debe complementar con pruebas de navegador reales: en el entorno de desarrollo Chromium tiene una restricción de permisos que impide validar visualmente el despliegue completo. Es necesario comprobarlo en el PC y móvil del usuario.

## Verificación manual rápida

1. En un **partido de pruebas**, registra acciones de dos jugadores propios y uno rival.
2. Entra en **Scouting → Analizar**, cambia equipo y filtro de P1 a P6 y comprueba que solo aparecen las acciones guardadas en esa rotación.
3. Compara Set actual con Partido completo.
4. Abre un rally pasado, corrige un código y vuelve a Analizar; las cifras deben reflejar la corrección.
5. Deshaz un punto, cambia de set y repite la comprobación sin conectividad; verifica después en otro dispositivo la sincronización normal.

## Próxima fase

El siguiente objetivo arquitectónico es migrar paulatinamente las tablas clásicas del análisis a estos modelos tipados, con comparaciones automáticas y sin eliminar de golpe sus funciones actuales.
