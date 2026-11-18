# Volley Coach · V20.5.6 · Validación paralela del scouting

## Qué añade esta actualización

Este paso acerca el scouting al motor TypeScript **sin reemplazar el registro original**. La previsualización V20.5.1 ya llama a `v680ParseCode` para comprobar lo escrito antes de añadir una acción. V20.5.6 **reutiliza ese mismo resultado** y publica una señal local para que el módulo TypeScript compare los datos fundamentales: equipo, dorsal, fundamento y evaluación.

- **Una sola llamada al parser nativo por previsualización**: la comparación TypeScript no ejecuta nuevamente `v680ParseCode`.
- **Gestión → Comparación de códigos · sesión actual**: muestra borradores revisados, coincidencias, diferencias, sintaxis aún no soportadas, rechazos originales y casos que no se han podido comparar.
- **Informe JSON local y anónimo**: se puede descargar manualmente. Contiene recuentos y hasta 80 incidencias resumidas, **sin el código introducido, dorsal, nombres, ID de partido, vídeos ni datos de nube**.
- **Borrado de sesión**: el botón «Limpiar sesión» vacía estos contadores en memoria; no altera partidos ni copias de seguridad. Al recargar, el informe temporal también desaparece.

La clasificación sirve para detectar problemas en una migración progresiva, no para afirmar que un rally o un código sean reglamentariamente válidos.

## Cómo comprobarlo en la aplicación

1. Actualiza los archivos en GitHub Pages y, tras la publicación, recarga la web. Si continúa la versión anterior, cierra y vuelve a abrir la PWA para que el Service Worker se actualice.
2. Abre un **scouting de prueba activo** (no uno acabado) y entra en la zona de códigos del partido. Escribe un código como `7A#` con un dorsal que exista en tu plantilla; espera un instante a que aparezca la previsualización.
3. Sin añadir obligatoriamente la jugada, vuelve a **Gestión**. Debajo de «Reglas TypeScript · diagnóstico» encontrarás «**Comparación de códigos · sesión actual**».
4. Revisa los contadores. Si el código tenía la estructura reconocida y el parser original devolvió los mismos cuatro campos, se mostrará como **Coincidencia**. Un dorsal desconocido suele quedar como **Rechazo nativo**.
5. Pulsa **Descargar informe JSON** para compartir el resultado técnico sin incluir datos individuales, o **Limpiar sesión** para empezar una nueva revisión.

Si escribes el código y lo envías inmediatamente sin esperar a la previsualización (140 ms de espera tras la edición), puede que **no quede contabilizado**. Por ahora la comparación cubre *borradores que ha visto la previsualización*, no las acciones ya guardadas ni todos los códigos de un partido histórico.

| Resultado | Interpretación correcta |
| --- | --- |
| **Coincidencia** | El encabezado del borrador y la respuesta del parser nativo concuerdan en equipo, dorsal, habilidad y valoración. |
| **Diferencia** | Esos campos discrepan; merece investigar el caso, pero no prueba un fallo del marcador. |
| **Cobertura pendiente** | El parser original acepta una sintaxis que el inspector TypeScript todavía no reconoce. |
| **Rechazo nativo** | El parser original no pudo aceptar el borrador; podría faltar un dorsal o haber una sintaxis inválida. |
| **Sin comparar** | Faltan datos suficientes para cotejar los dos resultados. |

## Archivos modificados

| Archivo | Motivo |
| --- | --- |
| `231-vc2051-scouting-expert.js` | Reenvía un evento local con campos básicos **ya calculados** por el parser de previsualización. |
| `src/domain/shadow-validation.ts` | Comparador puro y contadores de sesión anonimizados y limitados. |
| `src/domain/shadow-runtime.ts` | Panel en Gestión, descarga y limpieza de informes. |
| `src/domain/code-grammar.ts` | Compara dorsales normalizando los ceros iniciales. |
| `src/vc2055-entry.ts` | Incluye la validación paralela en el módulo ES6 existente. |
| `vc2055-domain-core.mjs` | Módulo **compilado**, imprescindible para GitHub Pages sin Vite en el servidor. |
| `vc2055-domain.css`, `index.html`, `service-worker.js` | Aspecto de Gestión, revisión de caché y nuevos parámetros de versión. |
| `package.json`, `package-lock.json`, `vc2055-domain.test.cjs`, `vc2056-shadow-validation.test.cjs` | Identidad de entrega y pruebas automáticas. |

No se han alterado `scoutPushAction`, el marcador, el orden real de saque, el deshacer, la validación de sustituciones oficial, el vídeo, IndexedDB ni el protocolo CAS/Supabase.

## Instalación en tu GitHub existente

1. Esta entrega incremental requiere que tengas **V20.5.5**.
2. Descomprime `Volley_Coach_V20.5.6_SOLO_CAMBIOS.zip`.
3. En tu repositorio [marcgnunez-collab/volley-coach](https://github.com/marcgnunez-collab/volley-coach), sube **todos los archivos del ZIP conservando las carpetas `src/` y `src/domain/`** y sustituyendo los archivos con el mismo nombre.
4. Deja los archivos históricos que ya existen en el repositorio, aunque no figuren entre los cambios: **no borres la carpeta completa ni sustituyas el proyecto por el ZIP de publicación de Vite**.
5. **No olvides `vc2055-domain-core.mjs`**, ya compilado. GitHub Pages no ejecuta TypeScript ni Vite por sí solo.

El ZIP `COMPLETO` es una copia íntegra del proyecto; `PUBLICACION_VITE` contiene únicamente la compilación opcional `dist/`. **No mezcles** la distribución Vite con el repositorio fuente si sigues publicando desde la raíz de la rama `main`.

## Desarrollo y verificación

```bash
npm ci
npm run typecheck
npm run build
npm run test:foundation
```

Las pruebas cubren paridad con el parser de previsualización usando **una única llamada**, clasificación de casos, límites y privacidad del informe, montaje y desmontaje del panel, recursos públicos y regresiones de arquitectura, diario/sincronización y scouting.

### Límites y siguientes pasos

- No se ha probado en un partido oficial ni con dos dispositivos reales; las pruebas son locales y automatizadas.
- La previsualización y el parser nativo siguen siendo las autoridades operativas: **la comparación no registra, corrige ni bloquea códigos**.
- No se implementan aún sintaxis DV4 completa, importación/escritura `.dvw`, reglas oficiales de todas las competiciones ni detección completa de faltas de rotación.
- Siguiente paso razonable: definir un contrato tipado único para **eventos confirmados** y ampliar la cobertura del parser TypeScript sobre un corpus real anonimizado; mantener el registrador original hasta disponer de equivalencia verificable, deshacer fiable y pruebas en directo.
