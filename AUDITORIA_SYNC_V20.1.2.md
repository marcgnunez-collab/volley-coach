# Volley Coach V20.1.2 — Auditoría de validación multidispositivo

**Base auditada:** `Volley_Coach_V20.1.1_COMPLETO.zip`.

## Arquitectura conservada

- Escritor único en `index.html`, script `v962-cloud-efficient-runtime`, tabla `volley_state` y compare-and-set (CAS) por `user_id` y `updated_at`.
- Política de reintentos y bloqueos en `209-vc2001-sync-reliability.js`.
- Diario de lotes persistente en IndexedDB en `210-vc2011-durable-sync-journal.js`.
- Presencia Realtime separada del guardado confirmado en Supabase.
- Los datos actuales no se migran ni se reescriben por esta actualización.

## Fallos corregidos

1. **Lectura fallida como éxito:** `lastReadAt` y contadores de lecturas se actualizaban aunque el servidor respondiera con error. Ahora se actualizan solo tras una respuesta Supabase válida y sin error.
2. **Estado remoto falsamente aplicado:** el writer invocaba `window.aplicarEstadoCloud?.(incoming)` con encadenamiento opcional. Si faltaba, declaraba `remoteApplied=true`. Ahora comprueba que existe y bloquea en modo protección si falta o lanza una excepción.
3. **Respuestas remotas malformadas:** se rechazan objetos sin la estructura `{data,error}` en vez de confundirlos con una fila inexistente.
4. **Evidencia de versiones insuficiente:** se registran por sesión tres marcas distintas: vista, procesada por el aplicador y confirmada como escritura CAS. Los tres estados no equivalen a Realtime ni a una verificación de contenido visible.

## Panel añadido

`211-vc2012-multi-device-validation.js` y `vc2012-multi-device-validation.css` añaden a **Dispositivos y nube**:

- Marcas de versión remota vista, procesada y subida.
- Cantidad de lotes locales del diario de V20.1.1.
- Exportación de diagnóstico JSON **sin datos deportivos ni credenciales**.
- Importación local del informe del segundo dispositivo para comparar marcas de versiones.
- Instrucciones de validación con scouting de prueba y comprobación visual de los contactos.

No añade nuevas escrituras a la nube. La coincidencia de una marca significa que el aplicador del segundo dispositivo recibió esa versión, **no** que haya un acuse remoto específico del móvil ni que el contenido del partido haya sido verificado automáticamente.

## Pruebas automatizadas

- **160/160 pruebas Node aprobadas**, incluyendo nueve casos nuevos en `tests/v2012-multi-device-validation.test.cjs`.
- Servidor CAS simulado con **dos clientes independientes**: A sube y B recibe; dos ediciones incompatibles no pisan silenciosamente el primer envío; una edición sin conexión permanece pendiente.
- Casos de error: servidor sin respuesta válida, excepción en el aplicador, aplicador ausente y lectura remota fallida.
- Seguridad de diagnóstico: ni tokens, ni nombres, ni IDs, ni contenido del scouting en exportación.
- Revisión de sintaxis de **143 archivos JS** y **79 scripts internos** sin errores.
- Prueba visual aislada con Chromium a **1366 y 390 píxeles**, sin desbordamiento horizontal.

## Pendiente antes de uso comercial

- **No se ha ejecutado una prueba contra el Supabase del usuario ni entre PC/móvil físicos.** La simulación CAS no es equivalente a una verificación de producción.
- CAS sigue trabajando con estados completos por cuenta, no con operaciones independientes e idempotentes por rally/contacto.
- No hay acuse de recepción enviado por el otro dispositivo al servidor. El comparador de informes es manual y solo compara sellos.
- La función heredada de aplicación remota puede realizar conversiones o fusiones y devolver sin error incluso con datos incompletos. Por tanto, es indispensable verificar los rallies reales después de cada prueba.
- Los vídeos locales no se transfieren automáticamente mediante este motor.
- El ZIP base mantiene **11 referencias CSS históricas ausentes**; no se han inventado sustitutos ni se han eliminado esas referencias.

## Instalación

Ver `GUIA_INSTALACION_V20.1.2.md`. El paquete incremental requiere exactamente V20.1.1 y contiene cuatro archivos de ejecución y cuatro pruebas (ocho archivos en total). No se elimina ningún archivo del proyecto.
