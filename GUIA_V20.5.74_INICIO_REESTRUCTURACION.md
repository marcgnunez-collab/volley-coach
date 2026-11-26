# Volley Coach V20.5.74 — Inicio de la gran reestructuración

Esta versión **sí comienza a sustituir código clásico por TypeScript en la
aplicación en uso**, sin declarar aún una migración completa. También añade una
comprobación manual de los entrenamientos después de volver a abrir el navegador.

## 1. Primera pieza migrada: planificación

Archivos nuevos:

- `src/training/planning-core.ts`: cálculos puros de fecha local, lunes de semana,
  minutos de ejercicios y estado de un plan (realizado, en edición, pendiente,
  futuro).
- `src/training/planning-runtime.ts`: puente tipado y **solo lectura** entre la
  página clásica y el nuevo núcleo. Se instala una vez por ventana.

El archivo `002-core-training-v150-monolithic.js` **ya llama al nuevo núcleo**
para esas cuatro operaciones cuando ha cargado el módulo. Mantiene el mismo
cálculo como respaldo durante la carga inicial o si el módulo moderno no está
disponible. No se ha añadido ningún escritor, petición de red ni base de datos.

El motor de partidos/scouting, vídeo, REC, Delay y CAS/Supabase no cambia.

## 2. Comprobar entrenamientos tras cerrar y reabrir

En **Gestión → Arquitectura → V20.5.74** aparecen tres botones:

1. **Prepara una copia JSON completa** del club mediante la recuperación
   habitual y consérvala en un lugar seguro.
2. En V20.5.72, **activa la copia de entrenamientos** y espera a la confirmación.
   Si hay IDs sin identificar, detente y revisa antes de seguir.
3. Pulsa **«Comprobar entrenamientos»** (V20.5.72). Debería indicar coincidencia.
4. Opcionalmente descarga el JSON verificado con el botón V20.5.73.
5. En V20.5.74, pulsa **«1. Preparar prueba de entrenamientos»**. Se comprueba
   de nuevo la réplica antes de guardar el comprobante de prueba.
6. Cierra **todas** las pestañas/ventanas de la aplicación, sin tener entrenamientos
   en edición ni cambios de nube pendientes.
7. Vuelve a abrir Volley Coach en el **mismo navegador, perfil y dispositivo**.
   Pulsa **«2. Verificar tras volver a abrir»** antes de cambiar datos.
8. El resultado `verificado` significa que una conexión nueva de lectura a
   IndexedDB reconstruyó exactamente los entrenamientos que sigue teniendo el
   guardado original. La prueba se consume y no modifica los entrenamientos.

El comprobante solo incluye esquema, marca temporal, número de registros y una
huella SHA-256 del último JSON principal. **No contiene nombres, notas ni
datos del equipo**. Caduca a las 24 horas y puede cancelarse con el tercer botón.
La comprobación necesita IndexedDB, Web Locks y Web Crypto, que habitualmente
requiere HTTPS o localhost.

Si hay diferencias, registros antiguos o incompletos, base ausente, comprobante
caducado o datos incompatibles, se indica el problema y **no se restaura nada**.
Si otra pestaña conserva el bloqueo, el comprobante permanece pendiente para
que puedas reintentarlo.

**Límite importante:** el comprobante solo demuestra una reapertura y otra
lectura correcta; la web no certifica que el proceso se haya terminado a la
fuerza ni que sobreviva a un fallo de disco o corte eléctrico. No se ha
ejecutado una prueba real de cierre forzado en el navegador de este entorno.

## 3. Plan de reestructuración por entregas

| Fase | Trabajo | Condición para considerarla completa |
| --- | --- | --- |
| 1 · V20.5.74 | Primeros cálculos de planificación en TS y comprobación de entrenamientos tras reapertura | Paridad entre cálculos anteriores y actuales, datos intactos |
| 2 · Scouting | Consolidar validación, registro y escritura de acciones en un único núcleo TS; reducir progresivamente los puentes clásicos | Comparar acciones/rallies reales, deshacer, marcador y estadísticas sin doble escritor |
| 3 · Estado | Crear propietarios claros de estado de partido, jugadores, entrenamientos y club | Identidades estables, recuperación y pruebas de reinicio sin pérdidas |
| 4 · Persistencia y nube | Promover IndexedDB por entidades **solo tras** restauración reversible, pruebas multi-pestaña/dispositivo y protocolo CAS | Confirmación local y remota sin cambios perdidos, sin escrituras duplicadas |
| 5 · Interfaz y limpieza | Trasladar pantallas y flujos a Vite/TS; retirar antiguos scripts usados solo como compatibilidad | Misma navegación, grabación, vídeo, Delay, informes y pruebas visuales en PC/móvil |

La migración **no se hará como un reemplazo único** del gran monolito: cada
entrega deberá tener pruebas de regresión y una vía de vuelta. Esta versión
inicia la fase 1; **las fases 2 a 5 siguen pendientes**.

## 4. Instalación en GitHub

- **SOLO_CAMBIOS**: descomprime y sube el contenido completo a la **raíz del
  repositorio**, manteniendo `src/state/`, `src/training/` y `test-audit/`.
  Reemplaza los archivos homónimos, incorpora los nuevos y **no borres ningún
  archivo existente**.
- **COMPLETO**: respaldo íntegro de la versión de código fuente.
- **PUBLICACION_VITE**: web generada para alojamiento estático; **no mezclar**
  con el ZIP de código fuente del repositorio.

Después, deja finalizar GitHub Actions y comprueba manualmente: navegación,
entrenamientos, planificación semanal/mensual, scouting con marcador,
REC/Delay, vídeo y sincronización. No actualices durante un partido, una
grabación o una sincronización pendiente.

Pruebas de este paquete: `npm run test:foundation` (499 pruebas) y
las 42 pruebas históricas de compatibilidad de `test-audit/`.
