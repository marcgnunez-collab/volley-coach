# Volley Coach V19.3.19.5 — Professional Tables & Tactical Views

**Base:** V19.3.19.4 completa. **Ámbito:** presentación y consultas de Análisis, sin migración de datos.

## Funcionalidad

- **Análisis → Análisis táctico → Análisis de pista:** vista profesional unificada de pista de seis zonas y cuadrantes A/B/C/D, con tablas por zonas, jugadores, rotaciones y valoraciones. Los controles de zona, cuadrante, jugador, fundamento y valoración actualizan los mismos contactos de la proyección del scouting.
- **Rallies vinculados:** toda selección utiliza `rallyKey` original, sin crear objetos persistidos. La columna Vídeo deriva a Video Analysis para ese rally mediante el enrutador existente; no se crea otro reproductor.
- **Distribution:** conserva consecutiva P1–P6 y seis tablas cruzadas de V19.3.19.3. Se elimina la duplicación simultánea de las tablas de atacante y combinación del resumen inferior; se intercambian con tres subpestañas (zonas, atacantes, combinaciones).
- **Diseño:** componentes visuales coherentes, pista compacta y listado de rallies con desplazamiento interno. Se mantienen los estilos base de V19.3.19.3.1 y V19.3.19.4.
- **Optimización:** el enrutador ya no calcula simultáneamente el render de Court Analysis nuevo y el heredado. Si el nuevo módulo falla o falta, recurre a la vista anterior.

No modifica Supabase, Realtime, servicio de grabación, vídeo en vivo, Delay, puntuaciones, equipos, datos persistidos, códigos DV ni permisos. No inventa zonas, valoraciones, marcadores o tiempos.

## Archivos que hay que subir a GitHub

Usa el ZIP `Volley_Coach_V19.3.19.5_SOLO_SUBIR_GITHUB.zip` solo si tu repositorio ya contiene **V19.3.19.4**.

| Ruta exacta desde la raíz del repositorio | Acción |
|---|---|
| `index.html` | Sustituir |
| `191-vc19310-professional-analysis-architecture.js` | Sustituir |
| `198-vc193161-distribution-intelligence.js` | Sustituir |
| `service-worker.js` | Sustituir |
| `206-vc193195-professional-tactical-tables.js` | Añadir |
| `vc193195-tactical-tables.css` | Añadir |

**No subir el ZIP sin descomprimir. No borrar los otros JS/CSS.**

Si el repositorio es anterior a V19.3.19.4, utiliza el paquete completo, comparando las rutas y haciendo copia previa de los datos.

## Pasos de instalación

1. Descargar una copia del código actual y exportar los scoutings/entrenamientos que sea posible restaurar.
2. Descomprimir `SOLO_SUBIR_GITHUB.zip`.
3. En GitHub, reemplazar los cuatro archivos indicados y añadir los dos nuevos, **todos en la raíz**, sin crear subcarpetas extra.
4. Confirmar el commit. Esperar a que GitHub Pages termine de publicar, **sin editar scoutings desde una pestaña desactualizada durante la actualización**.
5. Recargar con `Ctrl + F5`. Si está instalada como PWA, cerrar y reabrir; revisar el servicio de caché si persisten recursos antiguos.
6. Probar `Análisis → Análisis táctico → Análisis de pista`: seleccionar Z4, luego A, cambiar a tabla Jugadores y abrir el vídeo de un rally. Comprobar también consecutiva y sobre bases de Distribution.
7. Si alguna herramienta falla, revertir **solo** estos cuatro archivos reemplazados a V19.3.19.4 y retirar los dos nuevos. No restaurar datos cloud ni borrar scoutings.

## Validación y límites

- 110 pruebas automáticas Node aprobadas: 99 heredadas y 11 nuevas para filtros, equipo, rotaciones, cuadrantes, estadísticas, protección HTML, vídeo y actualización tras corrección de contacto.
- 138 archivos JavaScript y 79 scripts HTML internos analizados sin errores sintácticos.
- Chromium aislado en escritorio de 1430 px y móvil de 390 px: mapa, filas, evidencias, botón Vídeo, matrices de Distribution y ausencia de desbordamiento de página.
- **No se ha conseguido validar el arranque completo por HTTP**: el navegador del entorno bloquea `127.0.0.1` con `ERR_BLOCKED_BY_ADMINISTRATOR`. No se ha probado la sincronización real de Supabase PC–móvil ni se garantizan rendimientos de partidos largos en equipos reales.
- Persisten en el ZIP anterior **11 referencias a CSS inexistentes**, listadas en `docs/ARCHITECTURE_AUDIT_V19.3.19.1.md`. No se han creado versiones vacías ni eliminado referencias; hay que recuperarlas desde el repositorio real o retirar dependencias después de comprobarlas.
