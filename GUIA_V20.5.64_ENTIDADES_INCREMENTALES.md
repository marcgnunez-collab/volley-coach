# Volley Coach V20.5.64 · Entidades e incrementos locales de prueba

**Base V20.5.63.** Esta versión añade un piloto manual de escritura parcial por registro, sin convertir sus datos en fuente principal de Volley Coach.

## Qué encontrarás

Abre **Gestión → Repositorios piloto**. Debajo de la comprobación de V20.5.63 verás:

1. **Analizar IDs** (solo lectura): muestra cuántos registros tienen identidad reutilizable y cuántos no pueden migrarse todavía sin riesgo.
2. **Ensayar cambios parciales**: compara registros de jugadores, entrenamientos y temporadas con el repositorio piloto; escribe únicamente los nuevos o modificados, retira del **piloto** los antiguos y vuelve a leerlos para comprobar el resultado.
3. **Eliminar réplica piloto** (V20.5.63): elimina también las colecciones nuevas de la misma base de prueba, previa confirmación.

La nueva base utiliza `VolleyCoachClubPartitionsV2063`, ahora con esquema interno **2**. Las colecciones nuevas son `playerEntities`, `trainingEntities`, `seasonEntities` y `entityManifest`. Las cuatro colecciones anteriores se conservan y siguen funcionando.

## Política de identidad

- Para jugadores, sesiones e historiales se aceptan `id`, `uuid` o `_id` explícitos de tipo cadena no vacía o número entero seguro.
- Dos registros de la misma colección con el mismo ID se marcan como duplicados: **no se elige uno arbitrariamente**.
- Los registros sin ID no se escriben en el piloto incremental. **Permanecen íntegros en el guardado principal**.
- Los campos globales `meta`, `temporada`, `temporadaActual`, `season` y `seasonName` se tratan como registros de una sola entidad por campo/equipo.
- En una lista `temporadas`, un nombre de temporada no vacío o un ID explícito permite identificar cada entrada. Si hay entradas duplicadas o sin identificador, quedan pendientes.
- Los scouting completos, el vídeo y los datos que todavía no tienen modelo propio no se copian a este piloto.

## Qué sucede al probar un cambio

- Primera ejecución: se incorporan las entidades con ID verificable.
- Segunda ejecución sin cambios: se conservan las entidades sin reescribirlas; solo se actualiza el manifiesto de comprobación.
- Si editas un entrenamiento con ID: solo se actualiza su registro piloto.
- Si eliminas un jugador con ID: se elimina **solo del piloto**, en una transacción atómica junto con las demás modificaciones y el catálogo.
- Si una lectura no coincide, falla la cuota o los datos del club cambian durante el ensayo, no se declara una migración completa.

El ensayo puede ser **parcial** si hay registros antiguos sin ID. Esto no significa que la migración definitiva esté lista.

## Protección que se conserva

- Sigue intacta la clave principal `volleyCoachStateV43`, la copia `volleyCoachLibraryV1` y el diario de scouting `VolleyCoachScoutJournalV902`.
- Supabase/CAS, puntos, deshacer, rotaciones, vídeo y entrenamiento siguen usando las rutas actuales.
- El piloto no se ejecuta automáticamente al cargar ni al guardar.
- Se limita a **20.000 entidades** y **5 millones de caracteres JSON**.
- La réplica local puede incluir datos personales. Prueba preferentemente con datos ficticios y elimínala al terminar.

## Actualización en GitHub

1. Descarga una copia JSON de seguridad y conserva la V20.5.63.
2. Si ya tienes V20.5.63, sube todos los archivos de `Volley_Coach_V20.5.64_SOLO_CAMBIOS.zip` a la raíz del repositorio, manteniendo subcarpetas y reemplazando homónimos.
3. Para restaurar código completo, usa `Volley_Coach_V20.5.64_COMPLETO.zip`.
4. Para un despliegue estático que no compile Vite, utiliza `Volley_Coach_V20.5.64_PUBLICACION_VITE.zip` completo, sin mezclar compilados.
5. Recarga la aplicación después de actualizar la PWA.

## Prueba práctica y limitaciones

1. Pulsa **Analizar IDs** y revisa si hay registros pendientes.
2. Pulsa **Ensayar cambios parciales**, espera la verificación.
3. Repite sin cambios; el resultado debería indicar registros «sin cambios».
4. Edita **un registro de prueba que ya tenga ID** y repite: debería indicar un actualizado.
5. Borra la réplica piloto con el botón específico y verifica que la información original sigue visible.

Los tests automatizados incluyen simulaciones transaccionales, fallos y paridad. **No sustituyen aún** a pruebas reales de cierre forzoso, bloqueo de dos pestañas, sincronización PC/móvil y restauración desde IndexedDB. Hasta que esas pruebas estén completas, **no activar el guardado incremental como fuente principal**.

## Siguiente fase

**V20.5.65:** pruebas de recuperación real en navegador y protocolo para adjudicar IDs estables a registros históricos sin perder correspondencia ni modificar el scouting.
