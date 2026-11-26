# Volley Coach V20.5.73 — Recuperación verificada de entrenamientos

## Qué incorpora

La réplica voluntaria de entrenamientos de V20.5.72 ahora puede **reconstruirse
y exportarse**, sin utilizarla todavía como almacenamiento principal.

En **Gestión → Arquitectura → V20.5.73 · Recuperación de entrenamientos** aparece
el botón **«Descargar copia verificada de entrenamientos»**.

La exportación reconstruye por equipo, conservando el orden y los campos
originales, únicamente:

- Sesión actual (`sesionActual`).
- Historial (`historial`).
- Planificación (`planificacion`).
- Plantillas de entrenamientos (`plantillas`).
- Metadatos de sesión (`meta`) si el campo existía.

No incorpora biblioteca compartida, jugadores, partidos, acciones de scouting,
vídeos ni claves de Supabase. Un documento exportado puede contener nombres o
información personal escrita en las sesiones o notas: consérvalo protegido.

## Paso a paso

1. Haz primero una **copia JSON completa del club** desde **Gestión → Recuperación**.
2. Abre **Gestión → Arquitectura → V20.5.72 · Entrenamientos en paralelo**.
3. Activa voluntariamente la réplica; espera a que aparezca la confirmación
   de que los registros se han copiado y verificado. Si existen sesiones o
   planes con IDs ausentes o duplicados, la prueba se bloqueará sin inventarlos.
4. Puedes detener la copia, o pulsar **«Comprobar entrenamientos»**.
5. En **V20.5.73**, pulsa **«Descargar copia verificada de entrenamientos»**,
   acepta el aviso de privacidad y guarda el archivo JSON fuera del navegador.
6. Comprueba que el archivo descargado se ha guardado correctamente. No lo
   importes como sustitución del club: contiene solo entrenamientos.

## Qué comprueba antes de descargar

- Conexión nueva a IndexedDB y **una transacción de solo lectura** para leer
  el catálogo, todas las claves y todos los registros esperados.
- Coincidencia completa con el **último JSON principal confirmado** de la
  aplicación: datos, identidad, presencia/ausencia de campos y orden original.
- Ausencia de registros huérfanos o añadidos que no figuren en el catálogo.
- Reconstrucción en memoria, comparada de nuevo contra los campos originales.
- **Bloqueo exclusivo entre pestañas** durante la exportación. Si el club
  cambia mientras se comprueba, se cancela el archivo.

Si falta la réplica, hay una discrepancia, los IDs son inestables o existe un
error de almacenamiento, **no se ofrece ningún archivo**. El club original
no se corrige ni sustituye automáticamente.

## Limitaciones y siguientes pasos

Esta versión demuestra una reconstrucción y exportación local bajo los
supuestos comprobados, no una restauración automática ni resistencia a un
apagón. Antes de considerar IndexedDB como almacenamiento principal faltan:

- Validación de cierre forzado real con navegador ejecutable.
- Estrategia para registros históricos sin identidad estable y ensayo de
  importación/restauración reversible.
- Cobertura del resto de entidades y pruebas reales PC–móvil/Supabase.

## Instalación

- **SOLO_CAMBIOS:** descomprime, sube todos los archivos a la **raíz de GitHub**,
  conservando la carpeta `src/state`. Sustituye homónimos, añade los nuevos y
  **no elimines ningún archivo antiguo**.
- **COMPLETO:** proyecto completo para conservar como respaldo.
- **PUBLICACION_VITE:** web compilada para un hosting estático; no mezclar sus
  archivos con el ZIP de código fuente en un mismo despliegue.

Si compilas desde GitHub: `npm ci`, `npm run test:foundation`, `npm run build`.
Actualiza únicamente sin partido en directo, grabación activa o cambios
pendientes de sincronizar.
