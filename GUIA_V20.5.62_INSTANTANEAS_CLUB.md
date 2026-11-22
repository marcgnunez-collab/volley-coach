# Volley Coach V20.5.62 · Serialización del club sin copias redundantes

**Base: V20.5.61.** Es un paso de rendimiento hacia la futura separación en repositorios, no la migración completa a IndexedDB.

## Qué cambia exactamente

Cuando está disponible el módulo Vite/TypeScript:

1. Convierte los ejercicios de la biblioteca a JSON **una sola vez** por guardado.
2. Convierte los datos de los equipos (jugadores, entrenamientos, scouting y temporadas) **una sola vez**.
3. Construye la instantánea original de cinco campos en el mismo orden y con los mismos valores.
4. Reutiliza los bytes JSON de la biblioteca para la copia local independiente, sin volver a clonarla.
5. Entrega la instantánea al escritor original V20.5.61, que conserva la elección entre formato habitual y compacto.

Antes se hacían tres clones profundos solo en estas dos rutas: biblioteca en el estado principal, equipos en el estado principal y biblioteca en la copia independiente. Ahora estas tres clonaciones se evitan en la ruta tipada. **Se sigue serializando el estado completo por guardado**; todavía no hay escrituras incrementales por jugador o entrenamiento.

## Protección de datos

- El estado continúa en `volleyCoachStateV43` y la copia independiente continúa en `volleyCoachLibraryV1`.
- No cambia el formato de exportación, la recuperación, las rotaciones, las acciones de scouting ni el servicio de nube CAS/Supabase.
- Si falla la **preparación** tipada antes de escribir, se utiliza la preparación histórica; si falla la copia independiente, también conserva su preparación histórica.
- Si falla la **escritura principal**, se detiene: no se repite, ni se fuerza otra escritura, ni se sobrescribe la copia antigua.
- Cuando Vite no está instalado o no termina de cargar, la app usa las rutas de siempre.
- No se crea ninguna tabla nueva ni un segundo escritor de datos.

## Cómo comprobarlo

Puedes ejecutar lo siguiente en la consola del navegador después de cargar la aplicación:

```js
window.VC_CLUB_SNAPSHOT_20562?.VERSION
// "20.5.62"
window.VC_STORAGE_QUOTA_1531?.diagnostics?.()
```

La nueva función de preparación es interna: no modifica datos por sí sola. El diagnóstico del escritor V20.5.61 sigue indicando si el guardado fue normal, compacto o falló.

Para comparar costes con **datos sintéticos** (nunca del club real):

```sh
npm run build:domain
node scripts/benchmark-club-snapshot.mjs --rallies=10000
```

El benchmark exige igualdad exacta de bytes y muestra tiempos medianos de siete ejecuciones por ruta. No promete las mismas cifras de rendimiento en móviles.

## Instalación en GitHub

1. **Exporta antes una copia JSON del club** desde Recuperación y conserva la V20.5.61.
2. Si ya tienes la V20.5.61, descomprime `Volley_Coach_V20.5.62_SOLO_CAMBIOS.zip` y sube **todo su contenido** a la raíz del repositorio manteniendo las carpetas.
3. Si necesitas restaurar todo el código fuente, usa `Volley_Coach_V20.5.62_COMPLETO.zip`.
4. Si GitHub Pages publica archivos estáticos y no ejecuta Vite, sube el contenido de `Volley_Coach_V20.5.62_PUBLICACION_VITE.zip`. No combines compilados de distintas versiones.
5. Deja que se renueve el *service worker* y recarga la app.

## Pruebas manuales recomendadas

- Añade/edita un jugador, un entrenamiento y un partido de prueba; cierra y reabre la aplicación.
- Anota un punto de scouting y utiliza **Deshacer**; comprueba marcador, rotación e historial.
- Descarga una copia JSON; verifica que aparecen biblioteca, equipos y temporada.
- Desactiva la red durante un entrenamiento y verifica después de reabrir que el dato local sigue ahí.
- Comprueba la nube en **dos dispositivos reales**; una prueba local no demuestra recepción remota.
- Si aparece un error de cuota o de recuperación, **no borres los datos del navegador**: exporta primero una copia.

## Qué sigue

**V20.5.63:** preparar las colecciones de jugadores, entrenamientos y temporadas en repositorios IndexedDB con migración reversible, pruebas de lectura tras escritura y cotejo con la instantánea original. Antes de activar escrituras parciales en producción habrá que definir transacciones, reintentos, conflictos entre dispositivos y recuperación segura para no perder actualizaciones.
