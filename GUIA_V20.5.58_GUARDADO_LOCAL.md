# Volley Coach V20.5.58 · Estado real del guardado local

Base: V20.5.57. Continúa la migración incremental a Vite y TypeScript, sin sustituir los motores originales.

## ¿Qué cambia?

En **Scouting → Gestión del partido**, junto a los controles **PUNTO NUESTRO / DESHACER / PUNTO RIVAL**, aparece un indicador discreto de guardado local. Se actualiza al registrar un punto, deshacer un rally o crear un set:

| Indicador | Qué demuestra | Qué no demuestra |
| --- | --- | --- |
| **Guardado principal completado** (verde) | El escritor original terminó su operación principal sin error. | No garantiza lectura posterior, diario IndexedDB, nube ni recepción en otro móvil. |
| **Guardado principal en cola** (ámbar) | El guardado existente estaba ocupado y ha dejado un trabajo pendiente. | No significa que ese trabajo ya haya terminado. |
| **Error en el guardado principal** (rojo) | El guardado original produjo una excepción. | No significa que el punto haya sido deshecho ni que la copia local esté actualizada. |
| **Guardado principal sin confirmar** (neutro) | El módulo de confirmación no está disponible, se usó un respaldo antiguo o faltó una respuesta inequívoca. | No es una prueba de pérdida de datos. |

El texto **«diario y nube sin confirmar»** aparece a propósito: el `scoutV902Flush()` principal completa su propia operación, pero no espera ni prueba la escritura asíncrona de IndexedDB ni una recepción en otro dispositivo. Si el diagnóstico de IndexedDB comunica un incremento de errores durante la comprobación, se indica **«incidencia de diario detectada»**.

## Arquitectura de la mejora

- `src/domain/scout-local-save-receipt.ts`: clasificación pura, sin acceder a datos del partido.
- `src/domain/scout-local-save-receipt-runtime.ts`: adaptador de solo lectura instalado por Vite.
- `src/vc2055-entry.ts`: exporta y registra el adaptador.
- `index.html`, script `v121-native-score-script`: consulta el resultado del **mismo** guardado que ya existía y actualiza el indicador. No añade escrituras, reintentos ni una segunda puntuación.
- `vc20558-local-save-receipt.test.cjs`: comprueba éxito, cola, excepción, ausencia de Vite, respaldo antiguo, diario y carreras entre respuestas asíncronas.

Para un diagnóstico sin dorsales, códigos ni identificadores de partido, en la consola:

```js
window.VC_LOCAL_SAVE_RECEIPT_DIAGNOSTICS_20558?.()
```

El diagnóstico contabiliza resultados; no lee ni publica el contenido del partido.

## Instalación en GitHub

1. **Haz antes una copia de seguridad JSON** de la aplicación y conserva la versión actual.
2. Si tienes instalada **V20.5.57**, descarga `Volley_Coach_V20.5.58_SOLO_CAMBIOS.zip`, descomprímelo y sube **todos sus archivos** conservando carpetas y nombres. Sustituye los homónimos.
3. Si necesitas reconstruir la fuente desde cero, usa `Volley_Coach_V20.5.58_COMPLETO.zip`. Es el proyecto fuente (no incluye `node_modules`, ni el directorio temporal `dist`).
4. Si tu publicación web sirve directamente archivos compilados y no compila Vite, publica el contenido de `Volley_Coach_V20.5.58_PUBLICACION_VITE.zip` en la raíz web. **No mezcles indiscriminadamente** esta distribución compilada con los archivos fuente.
5. Vacía la caché/recarga la aplicación después de que el *service worker* haya actualizado la versión.

## Pruebas manuales imprescindibles

1. Sin conexión, inicia un scouting de prueba, registra un punto y verifica que aparecen el nuevo marcador y el estado de guardado; deshazlo y comprueba que marcador, saque y rotación vuelven al estado previo.
2. Repite con ambos equipos, cambio de set y reapertura de la aplicación. Comprueba la **persistencia real reabriendo** el partido: el aviso verde por sí solo no la demuestra.
3. Exporta una copia JSON y verifica la recuperación en un dispositivo distinto **sin sobrescribir datos reales**.
4. Para PC/móvil, confirma la recepción desde el otro dispositivo. Ninguna etiqueta de V20.5.58 la garantiza.
5. En caso de aviso rojo o ámbar persistente, **no cierres la sesión de inmediato**: exporta JSON y revisa Integridad / Copias en Gestión.

## Pendiente para el cambio definitivo de arquitectura

El diario IndexedDB sigue siendo asíncrono, el escritor de estado general continúa en los monolitos y la nube conserva su mecanismo CAS. Para afirmar «datos duraderos», habrá que añadir una confirmación read-after-write fiable y pruebas de recuperación reales en dos dispositivos; V20.5.58 no finge haberlas completado.
