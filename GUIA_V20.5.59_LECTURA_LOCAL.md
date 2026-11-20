# Volley Coach V20.5.59 · Lectura real del guardado local

Base: V20.5.58. Se conserva el único escritor nativo de puntos, rallies y persistencia.

## Qué se incorpora

En **Scouting → Gestión del partido**, después de un punto, un deshacer o un nuevo set:

1. El escritor V9.3.1 sigue grabando el estado completo en la clave habitual de `localStorage`.
2. Si devolvió `true`, el adaptador TypeScript captura el estado **del partido** en ese instante.
3. Cuando el navegador queda disponible, una lectura de solo lectura busca en `volleyCoachStateV43` el **mismo equipo y partido** y compara el JSON íntegro. No basta con comprobar el marcador: también se comparan acciones, rallies, saque, rotaciones y demás datos del partido.
4. Si empieza otro guardado o se cambia de partido, descarta la verificación antigua para no mostrar resultados desfasados.

| Resultado visible | Qué significa |
| --- | --- |
| **Lectura local verificada: partido coincide** (verde) | La copia principal leída en esta sesión es igual al partido capturado tras el guardado. |
| **La copia local no coincide** (rojo) | El contenido del partido almacenado es distinto. Guardar un JSON y revisar recuperación. |
| **No se encontró el partido** (rojo) | Falta la copia principal o el partido del equipo correspondiente. |
| **La copia local no se pudo interpretar** (rojo) | La lectura encontró un formato corrupto/inválido. |
| **Lectura omitida** (neutro) | El tamaño supera el límite, cambió el partido, falta el lector o no se pudo verificar de forma fiable. |

### Límites de seguridad y rendimiento

- La lectura se ejecuta en tiempo de inactividad del navegador, no dentro del cálculo del punto.
- Límite del estado completo: **6 millones aprox. de caracteres**; instantánea del partido: **2 millones**; estado compacto: **0,5 millones**. Los datos mayores quedan sin verificar, **no se borran ni recortan**.
- Para copias comprimidas se utiliza el **descompresor existente V15.3.1**. El verificador no comprime, reescribe, importa ni convierte datos.
- Una escritura ya aceptada no se deshace automáticamente si falla la lectura.
- La coincidencia prueba solo la **lectura coherente del almacenamiento principal en esta sesión**. No demuestra sincronización Supabase, diario IndexedDB, persistencia tras reinicio, ni recepción en PC/móvil. Para eso siguen siendo necesarias pruebas reales.

El diagnóstico agregado no expone datos del partido:

```js
window.VC_LOCAL_SAVE_RECEIPT_DIAGNOSTICS_20558?.()
```

Nuevos contadores: `readbackMatched`, `readbackDifferent`, `readbackMissing`, `readbackInvalid`, `readbackSkipped`, `lastReadback`.

## Instalación

1. **Descarga primero una copia de seguridad JSON** y guarda la V20.5.58 por si necesitas volver atrás.
2. Si tu código fuente en GitHub ya está en **V20.5.58**, usa `Volley_Coach_V20.5.59_SOLO_CAMBIOS.zip`. Descomprime y sube todos los archivos respetando rutas y nombres.
3. Si has de restaurar la fuente completa, utiliza `Volley_Coach_V20.5.59_COMPLETO.zip`.
4. Si publicas archivos ya compilados sin construir Vite, usa el contenido de `Volley_Coach_V20.5.59_PUBLICACION_VITE.zip` en la raíz de la publicación. No mezcles sus assets con fuentes de otra versión.
5. Actualiza y recarga la PWA hasta recibir el *service worker* V20.5.59.

## Verificación manual con datos de prueba

1. Con la nube desconectada, abre un partido de prueba, registra un punto y espera un instante: debe indicar **lectura local verificada**.
2. Deshaz ese rally: marcador, rotación y saque deben restaurarse sin registros duplicados y debe volver a verificarse el guardado.
3. Cierra la aplicación completamente y vuelve a abrir el partido. Comprueba que los puntos reaparecen: esta es una prueba adicional necesaria.
4. Repite en el móvil y confirma explícitamente desde el segundo dispositivo cualquier sincronización; V20.5.59 no la certifica.
5. Si aparece una advertencia roja, exporta JSON antes de cerrar la aplicación y revisa **Gestión → Recuperación / Integridad**.

## Siguiente etapa de migración

Queda sustituir progresivamente la persistencia pesada de los monolitos por un repositorio transaccional tipado en IndexedDB, con confirmación real del diario, política de recuperación y pruebas de caída de proceso / dispositivos. La V20.5.59 prepara ese cambio sin modificar aún el escritor único ni las reglas CAS/Supabase.
