# Volley Coach V20.5.57 · Registros de rally y restauración tipados

## Alcance real de la migración

El motor TypeScript construye ahora dos estructuras **que sí se utilizan en el partido en directo** cuando coinciden con sus equivalentes nativos:

- El registro del rally cerrado: identificador, set, saque, rotaciones, alineación, líbero y roles anteriores, marcador antes/después, ganador, acciones y tiempos.
- El `liveRally` restaurado al deshacer: identificador, acciones, inicio y estado de saque, rotación, alineación y marcador del comienzo del rally.

El motor histórico sigue siendo el **único responsable** de sumar/restar puntos, aplicar rotaciones, automatizar el líbero, enlazar vídeo, registrar eventos y guardar en IndexedDB, localStorage o CAS/Supabase. No se escribe dos veces ni se reintenta una operación.

## Seguridad y compatibilidad

1. La aplicación calcula el registro anterior con las funciones nativas existentes y sus copias/sellos temporales habituales.
2. TypeScript reconstruye el mismo registro usando esos valores preparados (sin hacer nuevas copias ni consultar el reloj).
3. Se comprueba que todos los campos, su orden y las referencias de acciones/alineaciones sean equivalentes; solo entonces se utiliza el resultado tipado.
4. Si falta el módulo Vite, devuelve datos incompatibles, añade campos, lanza una excepción o presenta cualquier diferencia, se conserva íntegramente el registro nativo.
5. El diagnóstico tiene solo contadores numéricos; nunca guarda códigos, nombres, dorsales ni identificadores privados.

Este cambio alcanza el constructor de cierre activo basado en la corrección de rotaciones V6.10.7 y la reconstrucción nativa de deshacer. **Quedan escritores históricos y otras rutas sin migrar**; tampoco se ha sustituido el diario IndexedDB ni la recepción de cambios en otro dispositivo.

## Instalación sobre V20.5.56

1. Crea primero una copia JSON del club en **Gestión → Recuperación**.
2. Descarga el paquete `SOLO_CAMBIOS` y sube su contenido a la raíz de GitHub manteniendo las carpetas; sustituye los archivos con el mismo nombre.
3. Si necesitas reinstalar todo el proyecto utiliza `COMPLETO`. Para despliegue por Vite utiliza `PUBLICACION_VITE` solo en el destino de publicación compilada.
4. Actualiza la página sin caché y verifica que el paquete nuevo está publicado por completo.

## Verificación manual recomendada

En un partido de **prueba**:

1. Registra un rally con varias acciones y suma un punto al equipo receptor. Comprueba que el saque y la rotación corresponden.
2. Deshaz el punto: comprueba que las acciones vuelven al rally abierto, así como la alineación, el marcador y el saque anteriores.
3. Repite cerrando un set con 25 puntos (o 15 en el quinto), con cambio automático de líbero y con vídeo asociado.
4. Revisa el vídeo/REC y los clips vinculados; exporta una copia JSON y prueba una recuperación local.
5. Verifica el resultado en un segundo dispositivo conectado; no des por confirmada la nube solo porque el marcador cambió localmente.

`window.VC_RALLY_RECORD_DIAGNOSTICS_20557()` devuelve los contadores `closeTyped`, `restoreTyped`, `closeNative`, `restoreNative`, `mismatches` y `exceptions`. Las pruebas automatizadas cubren igualdad de registros, condiciones de rotación, set, campos de vídeo y ausencia de escrituras adicionales. Las pruebas de pabellón y de sincronización real siguen siendo necesarias.
