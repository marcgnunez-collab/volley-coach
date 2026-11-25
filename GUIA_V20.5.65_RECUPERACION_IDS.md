# Volley Coach V20.5.65 · Comprobación local e identidades históricas

## Qué aporta esta versión

La sección **Gestión → Repositorios locales de prueba** incluye dos botones manuales:

1. **Comprobar tras reapertura**: después de crear el piloto de entidades en V20.5.64 y recargar la aplicación, se conecta de nuevo a la base piloto `VolleyCoachClubPartitionsV2063` y compara su manifiesto y todos los registros de entidades admitidos con el club actual. Utiliza una transacción `readonly` y no crea una base vacía cuando no existe.
2. **Simular IDs históricos**: detecta registros antiguos de jugadores, entrenamientos y temporadas sin identidad explícita; propone identificadores opacos y prueba su incorporación **solo a una copia temporal en memoria**. Indica cuántas propuestas se pudieron ensayar y las incidencias pendientes. No añade IDs al club real.

Los botones permanecen desactivados si faltan las capacidades del navegador necesarias. No se ejecuta ningún ensayo al abrir Gestión, al puntuar o durante la sincronización.

## Procedimiento seguro

1. Exporta antes una **copia JSON** desde las herramientas de recuperación actuales y guárdala fuera del dispositivo.
2. En Gestión, pulsa **Analizar IDs** y, si procede, **Ensayar cambios parciales** (V20.5.64), que crea la réplica opcional.
3. **Recarga completamente la aplicación** y vuelve a Gestión.
4. Pulsa **Comprobar tras reapertura**. Una coincidencia solo acredita que se ha podido leer en esta sesión una copia que corresponde a las entidades seleccionadas del club actual.
5. Pulsa **Simular IDs históricos** para conocer el alcance de una futura migración. Las propuestas no se guardan, no se consideran identificadores definitivos ni resuelven duplicados existentes.

Si el club cambia entre la escritura del piloto y la comprobación, el resultado puede ser «distinto»: vuelve a ejecutar el ensayo V20.5.64 y repite la comprobación tras recargar. Si faltan IDs, la cobertura será parcial.

## Límites de seguridad

- Sigue siendo un **piloto local, no autoritativo**: el guardado original del club, el diario de scouting y la nube no se sustituyen ni se modifican.
- Leer con una conexión IndexedDB nueva **no equivale a una prueba de durabilidad tras cierre inesperado o fallo del dispositivo**. Tampoco demuestra que otro dispositivo haya recibido datos.
- La comprobación compara las filas previstas con el manifiesto. No ofrece restauración automática ni arbitraje de conflictos.
- Los datos personales pueden estar presentes en la réplica piloto; utiliza las funciones de gestión con autorización y las copias del club protegidas.
- Los IDs simulados se generan con `crypto.randomUUID()` y se descartan al terminar. No los reutilices como IDs reales sin una migración posterior con validación y reversibilidad.

## Verificación técnica

- `npm run test:foundation`: typecheck, construcción de Vite y pruebas de regresión, incluidas las de recuperación e identidades.
- `node --test test-audit/*.test.cjs`: auditorías históricas; las pruebas que requieren un navegador pueden omitirse en entornos sin Chromium disponible.
- `npm run build`: genera la distribución estática de publicación.

Esta versión **no activa una migración definitiva** a los repositorios por entidad; prepara sus comprobaciones para un despliegue seguro y reversible.
