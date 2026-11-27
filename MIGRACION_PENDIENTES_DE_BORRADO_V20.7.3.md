# Volley Coach · Inventario acumulado de limpieza (V20.7.3)

## NO BORRAR NINGÚN ARCHIVO DE GITHUB TODAVÍA

Se ha acordado terminar primero toda la migración y realizar **una sola limpieza final**. Los archivos antiguos pueden permanecer físicamente en GitHub; el HTML y el service worker dejan de cargarlos cuando se reemplazan por los módulos actuales.

El inventario automatizado `scripts/retained-legacy-assets.json` contiene **26 candidatos**, identificados en V20.7.0 (10), V20.7.1 (10), V20.7.2 (3) y V20.7.3 (3). Algunos quizá ya no estén en el repositorio y otros seguirán allí; no es necesario recuperar ni borrar ninguno ahora.

| Versión | Candidatos para revisar al final | Situación de carga |
| --- | ---: | --- |
| V20.7.0 | 10 | Fuera del HTML/manifest/cache actual; incluye archivos de auditoría e iconos duplicados |
| V20.7.1 | 10 CSS | Sustituidos por cuatro hojas CSS unificadas |
| V20.7.2 | 3 JS | Sustituidos por un único módulo de análisis táctico |
| V20.7.3 | 3 JS | Sustituidos por `vc2073-diagnostics-unified.js`; originales conservados para pruebas y recuperación |

### Seguridad de la auditoría

La auditoría de publicación permite temporalmente **solo los nombres expresamente inventariados**. Sigue bloqueando:

- Archivos del cliente inexistentes.
- Recursos de caché duplicados o inexistentes.
- IDs duplicados de scripts.
- Archivos raíz no utilizados y no inventariados.
- Reintroducir en HTML o en la precarga un archivo identificado como candidato a retiro.

### Condiciones antes de la limpieza definitiva

1. Completar la migración funcional de los módulos restantes de interfaz, lectura, análisis y, con protección específica, los núcleos de negocio.
2. Validar en GitHub los flujos de Scouting/Match Mode, vídeos REC/Delay, gestión de clubes, dispositivos y sincronización real.
3. Mantener copias completas y exportaciones JSON de los datos de clubes/partidos antes de eliminar archivos históricos.
4. Comparar las dependencias de la versión final con este inventario, retirar entradas usadas o modificadas y confirmar exactamente qué sobra.
5. Solo entonces entregar **una lista final verificada y única** para borrar en GitHub.

**VITE:** sigue siendo parte del flujo de construcción de TypeScript. Si se usa SOLO_CAMBIOS no hay que subir PUBLICACION_VITE también.
