# Volley Coach V20.5.66 · Ensayo de reconstrucción desde IndexedDB

## Objetivo

Preparar el cambio futuro de arquitectura sin activar todavía un nuevo guardado principal: demostrar que las entidades independientes del piloto pueden **recomponerse de forma fiel** y que una pérdida, discrepancia, identidad pendiente o formato antiguo impide aprobar el ensayo.

La V20.5.64 ya guardaba filas independientes por jugador, entrenamiento y temporada. La V20.5.65 podía leerlas tras reabrir IndexedDB. En esta versión, el ensayo incremental añade al manifiesto de la **misma réplica opcional** los metadatos necesarios para reconstruir los datos:

- Orden original de jugadores, historial, planificación, sesiones y temporadas.
- Presencia de los campos: diferencia entre una lista vacía y un campo inexistente.
- Claves estables y catálogo completo de entidades previstas.

No se crea una base adicional ni se cambia el esquema de IndexedDB. Las nuevas escrituras siguen siendo **manuales** y solo sobre el piloto V20.5.64. El guardado real `volleyCoachStateV43`, las copias JSON, los rallies, el vídeo y Supabase permanecen intactos.

## Cómo probarlo en Gestión

1. Haz una copia JSON protegida del club antes de experimentar.
2. Abre **Gestión → Repositorios locales de prueba**.
3. Pulsa **Analizar IDs**. Si hay registros con identidades ausentes o duplicadas, el ensayo de reconstrucción indicará que está incompleto.
4. Pulsa **Ensayar cambios parciales**. Este paso **actualiza el manifiesto del piloto** con el orden y la presencia de campos que exige V20.5.66.
5. Si quieres reproducir una reapertura, recarga la aplicación y vuelve a Gestión.
6. Pulsa **Ensayar reconstrucción sin guardar**. El módulo lee la réplica con una conexión nueva y una transacción `readonly`, reconstruye en memoria los campos compatibles y compara el resultado de forma estricta con los del club actual.

### Interpretación de resultados

| Resultado | Significado | Acción sugerida |
| --- | --- | --- |
| Reconstrucción coincidente | Orden, campos y contenido seleccionados corresponden al club actual. | Conserva la fuente original; valida también en el dispositivo real. |
| Réplica inexistente | No existe un piloto compatible. | Ensayar cambios parciales antes. |
| IDs pendientes | Hay filas sin identidad estable, duplicadas o inválidas. | Revisar las incidencias; no migrar automáticamente. |
| Réplica incompatible | El manifiesto es antiguo o faltan metadatos de orden. | Volver a ejecutar el ensayo incremental V20.5.64. |
| Réplica distinta | Se ha modificado el club, el catálogo o algún registro. | Volver a generar la réplica y comparar con el club estable. |

## Garantías y límites

- **No ejecuta ninguna restauración**: los objetos reconstruidos se descartan al finalizar el ensayo.
- No incluye scouting, vídeos, claves privadas ni otros campos ajenos a jugadores/entrenamientos/temporadas.
- No se crean IDs ficticios para rellenar huecos. Si falta una identidad, la reconstrucción se detiene.
- La coincidencia compara la selección de campos disponible; **no acredita un guardado completo del club**, persistencia física ante un fallo de hardware ni recepción en otro dispositivo.
- La reconstrucción aún no reemplaza al escritor autoritativo ni al mecanismo de recuperación vigente. El cambio definitivo requerirá pruebas reales de cierres bruscos y una estrategia de reversión.

## Verificación técnica

- `npm run test:foundation` ejecuta el typecheck, Vite y pruebas de regresión.
- `node --test vc20566-club-entity-rehydration.test.cjs` ejecuta los ensayos de recuperación pura, orden, manifiesto, IDs pendientes y Gestión.
- `node --test test-audit/*.test.cjs` ejecuta auditorías históricas, sujetas a disponibilidad de Chromium y de puertos locales.

Este avance hace verificable la reconstrucción de las entidades en memoria, pero **no activa todavía una migración irreversible del club**.
