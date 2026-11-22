# Volley Coach V20.5.61 · Guardado general del club en TypeScript

Base: V20.5.60. Esta fase migra **la operación de almacenamiento** que persiste todo el club, sin rehacer su formato ni la sincronización remota.

## Qué cambia

El motor tradicional sigue preparando el JSON del club con jugadores, entrenamientos, ejercicios, partidos, scouting, historial y temporadas. La escritura de ese JSON pasa al módulo `src/domain/club-local-store.ts` cuando Vite está disponible:

1. Intenta guardar inmediatamente en `localStorage` con la clave **`volleyCoachStateV43`**, igual que antes.
2. Si no cabe, usa el compresor original **V15.3.1**, con prefijo `VC-LZW16-1:`. Primero verifica que se puede descomprimir exactamente al estado original.
3. Si tampoco cabe comprimido, se detiene y conserva la copia anterior. Nunca elimina otra clave ni IndexedDB.
4. Si se ha utilizado previamente el formato compacto, continúa con él como hacía la versión anterior.
5. **No se repite** la escritura original si una operación TypeScript devuelve un error. El código anterior solo actúa si el módulo no está disponible.

Es un cambio real en la ruta de escritura, no un segundo guardado ni una copia adicional.

## Compatibilidad que se conserva

| Componente | Estado |
| --- | --- |
| Clave `volleyCoachStateV43` | Sin cambios |
| Estructura JSON, jugadores, entrenamientos y temporadas | Sin cambios |
| Compresor/descompresor original V15.3.1 | Sin cambios |
| Copia independiente de la biblioteca | Sin cambios |
| Selector de equipo | Sin cambios |
| Diario IndexedDB V20.5.60 | Sin cambios |
| Supabase / CAS y PC/móvil | Sin cambios |

Si el motor TypeScript no llega a cargarse, V15.3.1 guarda mediante su función histórica.

## Comprobación técnica

En la consola del navegador:

```js
window.VC_STORAGE_QUOTA_1531?.diagnostics?.()
```

Verás contadores `typedNormal`, `typedCompact`, `nativeNormal`, `nativeCompact` y `typedFailures`, además del modo actual. No se muestran datos del equipo.

## Instalación en GitHub

1. **Haz una copia JSON de seguridad** y conserva V20.5.60 hasta verificar el resultado.
2. Si tu repositorio ya tiene V20.5.60, descomprime `Volley_Coach_V20.5.61_SOLO_CAMBIOS.zip` y sube **todos sus archivos**, manteniendo las carpetas y reemplazando los homónimos.
3. Si quieres restaurar todo el código fuente, utiliza `Volley_Coach_V20.5.61_COMPLETO.zip`.
4. Si la publicación es estática y no se compila Vite automáticamente, publica el contenido de `Volley_Coach_V20.5.61_PUBLICACION_VITE.zip`. No mezcles paquetes compilados de distintas versiones.
5. Espera a que la PWA actualice su *service worker* y recarga la aplicación.

## Pruebas manuales recomendadas

- Trabaja con datos de prueba sin conexión: añade un jugador, prepara un entrenamiento, crea un partido y anota/deshaz un rally.
- Cierra completamente la aplicación y vuelve a abrirla. Comprueba que se recuperan todos esos elementos.
- Exporta una copia JSON y verifica que incluye los datos de jugadores, entrenamiento, partido y temporada.
- Repite en móvil y portátil, comprobando la recepción **en el otro dispositivo** cuando haya nube.
- Ante un error de almacenamiento, exporta el estado actual antes de cerrar. **No borres IndexedDB, caché ni `localStorage` para intentar arreglarlo.**

## Lo que queda pendiente

La serialización completa del club todavía es responsabilidad del motor histórico y puede ser costosa con temporadas enormes. Las siguientes fases deberán sustituirla gradualmente por repositorios modulares en IndexedDB con consultas y escrituras incrementales, manteniendo pruebas de lectura real, recuperación y CAS.
