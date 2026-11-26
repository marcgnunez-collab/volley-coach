# Volley Coach V20.5.70 — Reapertura de jugadores

## Qué se ha añadido

En **Gestión → Arquitectura → Repositorios locales de prueba** aparece
**«V20.5.70 · Prueba de reapertura»** con el botón **«Probar reapertura de jugadores»**.

Esta prueba es voluntaria y no modifica los datos del club. Verifica la
replicación opcional de jugadores introducida en V20.5.67 mediante una nueva
conexión IndexedDB antes de recargar la página, y otra después. El único dato
guardado en `sessionStorage` es un billete de duración máxima de diez minutos
con la huella SHA-256 del guardado principal, el recuento y la fecha: **no
contiene los datos de jugadores**.

## Cómo probarlo sin arriesgar la temporada

1. Haz una **copia JSON completa del club** desde las opciones de recuperación
   existentes y guárdala en otro dispositivo.
2. En Gestión, activa la **copia paralela de jugadores** durante la sesión y
   espera la confirmación. Si no estaba creada, la prueba de reapertura se
   negará a continuar.
3. Puedes detener la copia y pulsar **«Comprobar jugadores»**.
4. Pulsa **«Probar reapertura de jugadores»** y acepta la recarga. Se cerrará
   temporalmente la vista y volverá a abrirse la aplicación.
5. Vuelve a Gestión y lee el resultado. **«Reapertura comprobada»** significa
   que todos los jugadores siguen coincidiendo con el guardado local previo.
   Cualquier otro resultado requiere revisar la copia y los IDs antes de seguir.

## Limitaciones importantes

- La prueba no se ejecuta si el navegador carece de IndexedDB, Web Locks,
  `sessionStorage` o WebCrypto SHA-256, o si otra pestaña mantiene la réplica.
- No crea una base IndexedDB ausente ni reescribe jugadores. No restaura el
  club ni modifica el scouting, los vídeos o el servicio de nube.
- Una **recarga controlada** no reproduce un corte de corriente, pérdida física
  de disco, proceso matado a la fuerza ni fallo de sincronización entre
  dispositivos. Para declarar IndexedDB almacenamiento autoritativo siguen
  faltando pruebas reales de caída y recuperación y la migración de todos los
  tipos de datos, no solo jugadores.
- Si cambias el club durante la prueba, el resultado será de discrepancia.

## Qué ZIP utilizar

- `Volley_Coach_V20.5.70_SOLO_CAMBIOS.zip`: extrae y sube **el contenido**, no
  el ZIP, a la raíz del repositorio GitHub, respetando todas las carpetas;
  reemplaza archivos homónimos y **no elimines los antiguos**.
- `Volley_Coach_V20.5.70_COMPLETO.zip`: proyecto de referencia completo.
- `Volley_Coach_V20.5.70_PUBLICACION_VITE.zip`: contenido ya construido para
  publicar en un alojamiento estático. No se mezcla con el código fuente.

Para compilación local: `npm ci`, `npm run test:foundation`, `npm run build`.
