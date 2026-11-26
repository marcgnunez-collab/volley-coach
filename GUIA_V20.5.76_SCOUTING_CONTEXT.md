# Volley Coach V20.5.76 — Scouting manual, pista y cambio de partido

## Qué se ha migrado

Esta es la tercera fase ejecutable de la gran reestructuración iniciada en V20.5.74. Además del código rápido migrado en V20.5.75, el **registro manual** y las acciones que parten de la **pista interactiva** (zonas, subzonas, coordenadas de contacto y destino por conos Data Volley) cruzan ahora un contrato TypeScript antes de llegar al **mismo escritor nativo existente**.

La vía pública `VC_SCOUT_CORE.push` utiliza esa misma puerta. Se conserva el objeto original de la acción y toda su información de jugador, evaluación, dirección, cono, tempo, contacto y vídeo. No se clonan ni reconstruyen acciones en el coordinador y no se añade un escritor paralelo.

El contrato recibe el partido y set capturados al comenzar la acción. Antes de ejecutar el escritor comprueba que ambos siguen activos y que no han sido cerrados. Si el usuario cambia de partido o set durante la preparación, la acción se **rechaza** y no se redirige al nuevo contexto.

El código rápido incorpora una comprobación equivalente **después del parser y antes del escritor**, tanto si el puente TypeScript está disponible como si ha de utilizarse el camino clásico. Se conserva la compatibilidad del puente V20.5.75; la nueva comprobación es opcional para sus consumidores.

## Dónde está implementado

- `src/domain/scout-direct-action-lane.ts`: contrato puro de identidad del partido/set y despacho de una sola acción manual.
- `src/domain/scout-direct-action-runtime.ts`: puente versionado `VC_SCOUT_DIRECT_LANE_20576`, inmutable, sin almacenamiento ni DOM.
- `src/domain/scout-registration-lane.ts`: comprobación opcional de contexto entre parser y escritor del código rápido.
- `src/vc2055-entry.ts`: instalación de ambos puentes con Vite.
- `021-core-scouting-v150-monolithic.js`: delegación de acciones manuales, coordenadas y conos y precondición contra partidos cambiados. El único `scoutPushAction` histórico sigue escribiendo las acciones.
- `077-v132-scouting-pro-workspace.js`, `089-v152-smart-rally-reports-exchange.js` e `index.html`: preservan el despacho protegido de la interfaz pública incluso cuando se instalan las envolturas de vídeo posteriores.
- `vc20576-scout-context-safety.test.cjs`: regresiones de la nueva fase.

## Seguridad y límites

- No se altera la suma de puntos, rotación, cierre de rally ni Deshacer.
- El vídeo, REC/Delay, marcado temporal, editor de rallies y campos Data Volley siguen en el motor histórico, sin sustituir sus envolturas.
- No se cambia el diario, la escritura local, IndexedDB ni CAS/Supabase.
- Si falla un adaptador **antes** de escribir se utiliza el escritor clásico una sola vez, siempre que el contexto continúe siendo válido.
- Si el escritor ya ha sido invocado, **nunca hay un segundo intento**, incluso si lanzó una excepción o dejó un cambio parcial.
- Si no existe un partido o el set está cerrado, se muestran los avisos anteriores; si cambió el contexto, se solicita repetir la acción.

El trabajo todavía **no convierte toda la aplicación a TypeScript**, ni hace de IndexedDB la fuente autoritativa, ni sustituye el motor de sincronización.

## Pruebas y validación pendiente

El test de esta versión verifica con simulaciones el objeto exacto de ataque con cono/coordenadas, puente inmutable, un solo escritor, fallo antes/después del despacho, rechazo de acciones ante cambio de partido o set y cambio durante el parseo del código rápido. La suite de V20.5.75 mantiene además 50 códigos rápidos consecutivos y comparación con su ruta clásica.

Las pruebas automatizadas **no certifican** la respuesta real de móviles, cámaras, cachés instaladas, cierre brusco de navegador ni Supabase. Esas comprobaciones requieren dispositivos y cuentas reales.

## Comprobación manual antes de usar datos oficiales

1. Haz una copia JSON completa de tus datos y espera a que termine la sincronización. No instales una actualización durante una grabación.
2. Abre un partido de prueba en PC y otro dispositivo.
3. Añade acciones con código rápido en scouting completo y en modo partido. Comprueba que aparecen una sola vez y en orden.
4. Añade saques, ataques y colocaciones con el formulario; marca origen, destino, subzona, coordenadas y un ataque por **cono 1–8**. Abre el editor y verifica que los metadatos permanecen correctos.
5. Cambia de partido y de set; comprueba que una acción preparada para un contexto antiguo no entra en el nuevo.
6. Registra un punto y usa **Deshacer**; compara el resultado con la versión previa, sin puntos duplicados.
7. Verifica REC, Delay, enlace de clips y la hora exacta del vídeo.
8. Prueba reconexión entre PC/móvil, pendientes y recuperación/sincronización mediante los controles existentes; no cierres incidencias sin comprobarlas.

## GitHub y despliegue

- **SOLO_CAMBIOS**: descomprime en la **raíz del repositorio** de V20.5.75; sube todos los archivos nuevos y reemplaza los homónimos, manteniendo las rutas `src/domain/` y `test-audit/`. **No borres** los scripts clásicos, carpetas, vídeos ni herramientas de recuperación.
- **COMPLETO**: copia independiente del código fuente V20.5.76, sin `node_modules`, cachés ni artefactos locales de compilación.
- **PUBLICACION_VITE**: salida compilada `dist/` para alojamiento estático. No la mezcles con `src/` en GitHub.

Si trabajas localmente: `npm ci` (o `npm install` si no hay lock), `npm run test:foundation` y `npm run build`. Revisa GitHub Actions y realiza el ensayo manual antes del primer partido real.

## Siguiente fase

Migrar los controles complejos de edición de rallies y su estado a contratos TypeScript, sin multiplicar escritores, con ensayos específicos de vídeo y sincronización antes de retirar componentes antiguos.
