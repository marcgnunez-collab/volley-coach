# Volley Coach V20.5.71 — Cierre completo y verificación posterior

## Objetivo

Verificar que la réplica opcional de jugadores (IndexedDB) permanece disponible
después de **cerrar completamente el navegador** y abrirlo otra vez. La prueba
es manual: JavaScript no puede demostrar por sí mismo que el proceso cerró,
fue terminado con SIGKILL o sobrevivió a un apagón.

## Instrucciones de uso

1. En **Gestión → Recuperación**, descarga antes una **copia JSON completa del
   club** y guárdala fuera del navegador.
2. En **Gestión → Arquitectura → Repositorios locales de prueba**, crea la
   réplica voluntaria de jugadores (V20.5.67) y espera su verificación. Puedes
   detenerla después. La réplica debe coincidir con el último club guardado.
3. Baja hasta **V20.5.71 · Cierre completo** y pulsa
   **«1. Preparar prueba de cierre»**. Confirma la acción.
4. Cuando veas «Prueba preparada», cierra **todas las ventanas del mismo
   navegador**. Es importante no cambiar de perfil ni borrar los datos de la
   página. Vuelve a abrir Volley Coach en **el mismo origen y perfil**.
5. En Gestión, pulsa **«2. Verificar tras el cierre»** antes de modificar el
   club. El resultado aparecerá **debajo de estos botones**.
6. Si decides no continuar, pulsa **«Cancelar prueba»**. Solo elimina el
   comprobante de la prueba, nunca la réplica ni el club.

## Qué verifica exactamente

- Antes del cierre se comprueban todas las entidades de jugadores en una
  conexión IndexedDB de solo lectura. Se guarda una marca temporal, el número
  de jugadores y un digest SHA-256 del JSON principal en la clave independiente
  `vc20571-player-cold-check-once` de `localStorage`.
- Tras reabrir se comprueba que **el club principal no ha cambiado**, que
  todos los jugadores siguen estando en IndexedDB y que sus datos y orden
  coinciden. La comprobación está protegida con Web Locks entre pestañas.
- El comprobante **caduca a las 24 horas**; una vez verificado se consume.
- No se guardan nombres, vídeos ni scouting en el comprobante.

## Lo que NO demuestra

- No verifica la supervivencia de un corte de luz, fallo de disco o SIGKILL
  real. El sistema web no distingue un cierre normal de uno forzado.
- No es una prueba de sincronización Supabase ni entre ordenadores/móviles.
- No convierte IndexedDB en almacenamiento principal. Aún necesitamos una
  prueba real de cierre forzado en un navegador ejecutable y migrar las demás
  entidades de forma reversible, sin perder la compatibilidad anterior.

## Instalación de V20.5.71

- **SOLO_CAMBIOS:** descomprime y sube todos los archivos y carpetas a la raíz
  de GitHub, sustituyendo los homónimos. **No borres los antiguos**.
- **COMPLETO:** copia de referencia de todo el proyecto.
- **PUBLICACION_VITE:** estático compilado para despliegue; **no se mezcla** con
  el código fuente en la misma subida.

Comprueba localmente con `npm ci`, `npm run test:foundation` y `npm run build`.
La prueba automática `npm run test:browser-recovery` solo se ejecuta cuando
Chromium está realmente disponible; una prueba omitida no es evidencia positiva.
