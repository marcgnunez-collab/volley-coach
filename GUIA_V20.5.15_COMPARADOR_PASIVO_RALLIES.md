# Volley Coach V20.5.15 · Comparador pasivo de rallies

## Qué incorpora esta versión

Se ha añadido un **comparador automático en segundo plano** entre resultados ya confirmados por el Scouting original y las proyecciones puras de TypeScript.

1. **`src/domain/rally-shadow.ts`:** compara exclusivamente el último rally añadido o el último rally reabierto, sin recorrer el historial. Coteja marcador, servicio, rotaciones y final de set; en un deshacer puede contrastar acciones, alineación capturada y marcadores de vídeo.
2. **`src/domain/rally-shadow-runtime.ts`:** escucha las notificaciones de la capa observable existente (V20.5.9), agrupa los avisos y aplaza la comprobación a una tarea posterior. No intercepta teclas ni crea otro escritor.
3. **Panel en Gestión:** aparece como **«Comparador pasivo · V20.5.15 / Contraste de puntos y deshacer»**, después de «Lectura unificada del partido». Muestra operaciones comparadas, coincidencias, diferencias, casos sin verificar y cambios omitidos. Incluye «Actualizar informe» y «Limpiar contadores».
4. **`vc2055-domain.css`:** estilo compacto integrado con Gestión. El panel no afecta a las vistas del vídeo ni a los controles de anotación.

Los resultados posibles son:

- **Coincidencia:** los hechos disponibles concuerdan.
- **Diferencia:** existe una contradicción comprobable en marcador, servicio, rotaciones u otro campo contrastado.
- **Sin verificar:** faltan datos para concluir; **no implica un fallo del partido**.
- **Omitido:** no se puede asociar con seguridad el cambio a un punto o deshacer normal (por ejemplo, selección de partido, edición manual, nuevo set o salto de varios rallies).

Solo se comparan **cambios observados durante la sesión**; los rallies anteriores a la apertura no se vuelven a procesar. Se mantienen como máximo 40 incidencias en memoria, sin nombres, dorsales, códigos, IDs de partido ni enlaces de vídeo en el informe. El panel no acredita recepción en otro dispositivo.

## Garantías de compatibilidad

- No se ha modificado `021-core-scouting-v150-monolithic.js` ni los adaptadores V13.0/V13.1 (`233` y `234`).
- No hay cambios en el motor de punto/deshacer, líbero, subida CAS, diario IndexedDB, Supabase o recuperación.
- No hay descarga del historial completo ni cálculo sincrónico dentro de un evento de anotación. Como máximo se examina el último rally del set activo.
- Cambiar de scouting, editar un rally anterior o iniciar set **no** genera automáticamente una diferencia.
- Se puede desactivar este panel sin alterar datos: no tiene permiso ni ruta de escritura.

## Instalación en GitHub

### SOLO_CAMBIOS, desde V20.5.14

1. Descarga `Volley_Coach_V20.5.15_SOLO_CAMBIOS.zip` y descomprímelo.
2. Copia su contenido a la **raíz** de [volley-coach](https://github.com/marcgnunez-collab/volley-coach), preservando subcarpetas como `src/domain/`.
3. **Añade** `src/domain/rally-shadow.ts`, `src/domain/rally-shadow-runtime.ts`, `vc20515-rally-shadow.test.cjs` y esta guía.
4. **Sustituye** las versiones incluidas de `src/vc2055-entry.ts`, `vc2055-domain.css`, `vc2055-domain-core.mjs`, `index.html`, `service-worker.js`, `package.json`, `package-lock.json`, `README.md` y los tests ya existentes.
5. Confirma y publica la actualización. Después, espera a que entre en funcionamiento el nuevo service worker.

**No borres** los archivos anteriores ni conviertas los scripts clásicos a módulos ES6. Los nuevos módulos TypeScript ya están empaquetados en `vc2055-domain-core.mjs`, necesario para la versión estática de producción.

### COMPLETO y PUBLICACION_VITE

- `COMPLETO` contiene los archivos fuente y los scripts originales, sin `node_modules` ni salidas temporales de compilación.
- `PUBLICACION_VITE` contiene la compilación estática. No mezcles indistintamente su salida `dist/` con el repositorio fuente.

## Pruebas

- **102 pruebas actuales** superadas mediante `npm run test:foundation`, con TypeScript, Vite y casos del nuevo comparador.
- **39 pruebas históricas** superadas: sincronización, CAS, diario duradero, compatibilidad entre dispositivos.
- **141 pruebas en total**.
- Auditoría estática: 0 archivos referenciados ausentes, 0 scripts duplicados.
- Simulaciones verifican coincidencias, diferencias reales, datos desconocidos, descarte de ediciones, detección de deshacer, privacidad, límite de historial, coalescencia y limpieza de suscripciones.

## Comprobación manual imprescindible

1. Abre un partido de **pruebas** y entra en **Gestión** para localizar «Contraste de puntos y deshacer».
2. Vuelve a Scouting y registra varios puntos (saque propio y rival); regresa a Gestión. El comparador debe mostrar las operaciones observadas.
3. Deshaz un rally, revisa que el marcador y los códigos se recuperan y comprueba el contador de deshacer.
4. Modifica un dato de un rally antiguo o cambia de partido: no debe contarse como fallo demostrado.
5. Repite con vídeo enlazado y líbero. Comprueba la sincronización real en portátil y móvil durante una pérdida de conexión y su recuperación.

La batería automatizada **no** sustituye una prueba completa de hardware, vídeo y sincronización real en dos dispositivos.

## Próximo paso de arquitectura

Reunir evidencia de sesiones reales con **cero diferencias confirmadas** antes de intentar activar una capa de comandos TypeScript. La sustitución del escritor exige un adaptador transaccional, reversible y con parada segura que conserve CAS, vídeos, líbero y las acciones nativas de forma demostrable.
