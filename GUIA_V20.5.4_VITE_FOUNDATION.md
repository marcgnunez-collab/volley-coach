# Volley Coach · V20.5.4 · Vite Foundation

## Alcance de esta versión

Vite ya es una herramienta de compilación **funcional**, con un primer archivo TypeScript compilado y un paquete de producción reproducible. La app histórica continúa funcionando con sus scripts clásicos y su único motor de escritura/sincronización. Esta fase **no** es todavía una SPA modular completa.

La compilación de prueba mantiene:

- Los mismos scripts clásicos en el mismo orden de carga.
- Los estilos históricos en sus posiciones originales para preservar la cascada CSS.
- Los mismos nombres de archivos para el Service Worker, vídeo, entrenamientos, scouting, CAS e IndexedDB.
- El módulo ES6 V20.5.3 compilado y empaquetado por Vite.
- Un pequeño módulo TypeScript para la identidad de compilación, sin modificar datos deportivos.
- Un Service Worker de producción que precarga también el módulo moderno con nombre hash.

**No se han añadido dependencias de React.** El paquete del navegador no incluye Node ni Vite; estas herramientas solo se usan durante la construcción.

## Archivos y función

| Archivo | Para qué sirve |
| --- | --- |
| `package.json` / `package-lock.json` | Versiones reproducibles de Vite y TypeScript y comandos `npm`. |
| `vite.config.mjs` | Configuración de compilación; conserva scripts/estilos originales y copia los recursos a `dist/`. |
| `tsconfig.json` | Validación estricta de los módulos TypeScript nuevos; permite coexistencia con JS. |
| `src/vc2054-entry.ts` | Entrada compilada de Vite, añade una marca técnica a la página. |
| `src/vc2054-build-contract.ts` | Primer contrato tipado puro. |
| `service-worker.js` | Versión de caché V20.5.4. La compilación añade sus archivos hash a la precarga. |
| `vc2054-vite-foundation.test.cjs` | Pruebas de equivalencia estática y recursos del paquete compilado. |
| `.gitignore` | Evita subir `node_modules/` y `dist/` al repositorio fuente por accidente. |

## Cómo instalar SOLO CAMBIOS en GitHub

1. Mantén instalada la V20.5.3.
2. Descomprime `Volley_Coach_V20.5.4_SOLO_CAMBIOS.zip`.
3. Sube **todos los archivos y la carpeta `src/`** a la **raíz del repositorio** `volley-coach`, respetando las rutas.
4. **Sobrescribe únicamente `service-worker.js`**. Los demás archivos son nuevos para esta fase.
5. No borres `index.html`, scripts antiguos, CSS, `recuperacion.html`, vídeos ni imágenes.

**Importante:** si GitHub Pages publica hoy directamente la raíz de `main`, subir SOLO CAMBIOS mantiene la web funcionando **sin cambiar aún el método de publicación**. Vite queda listo para compilar y probar, pero GitHub Pages no ejecuta `npm run build` automáticamente con esta versión. Evitamos así cambiar de golpe un despliegue de scouting que ya funciona.

## Compilar con Vite (si usas un ordenador de desarrollo)

Se necesita Node.js 20.19+ o 22.12+ y npm.

```bash
npm ci
npm run typecheck
npm run build
npm run preview
```

El comando `npm run build` genera `dist/` con la versión web terminada. `npm run preview` permite revisarla localmente antes de publicarla. Se esperan avisos de Vite sobre scripts clásicos que no llevan `type="module"`: es una decisión temporal para conservar la compatibilidad; **no son errores de compilación**.

Para desarrollo rápido: `npm run dev`.

## Tres ZIP de entrega

- **SOLO CAMBIOS:** actualiza el repositorio existente sin cambiar el tipo de despliegue.
- **COMPLETO:** contiene todo el código fuente con Vite y TypeScript, sin `node_modules` ni archivos generados.
- **PUBLICACIÓN VITE:** contiene el contenido de `dist/`, ya compilado, para probar una futura publicación optimizada. No mezclarlo con una actualización parcial del sitio en producción sin comprobar antes rutas, caché, vídeo y nube.

## Cómo saber si estás viendo la versión compilada

En las herramientas de desarrollo del navegador (Consola):

```javascript
document.querySelector('meta[name="vc-build-identity"]')?.content
```

Una compilación de Vite devuelve `20.5.4:vite-production`; el sitio de origen sin Vite no incluye esta marca. No lee ni cambia ningún dato del partido.

## Comprobaciones

```bash
npm run test:foundation
```

Esta orden comprueba TypeScript, compila, valida scripts clásicos, orden CSS, recursos del paquete y precarga del Service Worker. Además se mantienen las pruebas históricas de scouting/sincronización.

Antes de pasar GitHub Pages a la publicación Vite, probar manualmente un partido de ensayo (códigos, marcador, deshacer rally, revisión y video), trabajo sin red y dos dispositivos con cuentas reales. La compilación no demuestra por sí sola que la nube confirme la recepción remota.

## Próximo bloque

V20.5.5 · Migración controlada del motor de dominio: extraer funciones puras de códigos, reglas y estadísticas a TypeScript, con pruebas de equivalencia antes de tocar el registrador original.
