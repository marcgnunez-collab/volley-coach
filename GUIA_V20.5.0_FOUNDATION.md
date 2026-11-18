# Volley Coach V20.5.0 · Professional Foundation

## Alcance de esta entrega

Esta versión **no modifica** datos de scouting, contactos, tanteos, grabaciones, motor de sincronización CAS, almacenamiento IndexedDB ni esquema de Supabase.

Se añade una comprobación de integridad de archivos en **Gestión → Integridad de instalación**. Al pulsar **Comprobar archivos**, revisa los scripts y hojas CSS incluidos en el HTML (GET, sin caché, cuatro solicitudes concurrentes) y muestra archivos ausentes, errores HTTP o fallo de red. No inspecciona ni envía datos privados. Un resultado correcto no sustituye las pruebas funcionales reales.

La caché del service worker añade el sufijo `foundation-20.5.0` a su identificador histórico, que fuerza una nueva instalación de recursos estáticos sin alterar almacenamiento de usuario.

## Hallazgo importante: 11 CSS que faltan en el ZIP recibido

- `vc19-workflow.css`
- `vc1924-clip-studio.css`
- `vc1920-connection-hub.css`
- `vc1922-live-delay.css`
- `vc1923-video-scout-links.css`
- `vc1925-library-health.css`
- `vc1930-tactical-rivals.css`
- `vc1937-analysis-main.css`
- `vc1938-data-engine.css`
- `vc1939-rally-search.css`
- `vc19310-professional-analysis.css`

**No se han fabricado hojas vacías ni eliminado sus referencias.** Si estos archivos están en GitHub, consérvalos. Si también faltan allí, habrá que recuperarlos desde una versión anterior verificable o reconstruirlos comparando visualmente los módulos afectados. El ZIP completo de esta entrega conserva esa limitación del original y **no es un respaldo integral de esos CSS**.

## Subir a GitHub

### Solo cambios, recomendado

Descomprime `Volley_Coach_V20.5.0_SOLO_CAMBIOS.zip` y sube los archivos a la **raíz** del repositorio. Sustituye `index.html` y `service-worker.js`; añade `230-vc2050-release-health.js`, `vc2050-release-health.css`, `vc2050-foundation.test.cjs` y esta guía. No borres otros archivos. Espera la publicación de GitHub Pages y recarga la aplicación en móvil y ordenador.

### ZIP completo

`Volley_Coach_V20.5.0_COMPLETO.zip` contiene la base recibida, con las modificaciones, para archivo o subida si se conservan los 11 CSS previamente existentes. **No borres archivos de GitHub solo porque no aparezcan en el ZIP**.

## Comprobaciones

En el directorio descomprimido:

```
node --test vc2050-foundation.test.cjs
```

Las pruebas históricas incluidas esperan que los archivos `*.test.cjs` estén en una subcarpeta `test/` y que los módulos permanezcan en el directorio superior. Esta entrega no altera su código. Para ejecutarlas, cópialas a `test/` y ejecuta `node --test test/*.test.cjs`.

Después de desplegar, revisa Integridad de instalación, entra en un scouting de prueba, graba un rally, abre su vídeo y valida sincronización con **dos dispositivos reales**. No se ha probado conexión con tu Supabase ni cámara física.
