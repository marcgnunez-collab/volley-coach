# Volley Coach V19.3.19.4 — Unified UX & Analysis Workspace

**Base:** V19.3.19.3.1 Visual completo.

## Alcance

Se reorganiza visualmente **Análisis**, reutilizando el motor de datos, la selección de scouting y los enlaces a rallies y vídeo. Esta entrega no cambia el esquema, los equipos, los datos persistidos, las claves de Supabase ni las funciones de sincronización.

**Cinco áreas visibles en Análisis**:
1. Resumen (Match Analysis).
2. Fundamentos (nueva lectura por saque, recepción, colocación, ataque, bloqueo, defensa, freeball y control).
3. Análisis táctico (Distribution y Court Analysis).
4. Búsqueda y vídeo (Rally Search, Video Analysis y acceso existente a Video Montage).
5. Hojas e informes (Worksheets & Reports).

La selección de partido, equipo, set, rotación y K1/K2 sigue usando los selectores originales `vc157-*`, compartidos por todas las vistas. No se duplican datos ni controles nativos. La última subpestaña visitada en cada área se conserva durante la sesión; también se preserva el rally seleccionado cuando sigue estando en el conjunto filtrado.

**Nuevo enlace contextual:** el dock «Jugada seleccionada» permite ir al reproductor existente sin crear un segundo player ni generar marcas temporales.

## Archivos de código para actualizar en GitHub

| Ruta desde la raíz del repositorio | Acción |
|---|---|
| `index.html` | Sustituir |
| `191-vc19310-professional-analysis-architecture.js` | Sustituir |
| `service-worker.js` | Sustituir |
| `vc193194-analysis-workspace.css` | Añadir |

**No eliminar** `vc193161-distribution-intelligence.css`, `198-vc193161-distribution-intelligence.js`, `vc1931931-visual-system.css` ni los motores anteriores. No subas el ZIP como si fuera un archivo que la web pueda leer; descomprímelo primero.

## Instrucciones

1. Confirmar que GitHub contiene V19.3.19.3.1 o equivalente completo.
2. Guardar previamente una exportación del scouting y de los entrenamientos, y una copia del repositorio.
3. Descomprimir el paquete «SOLO CAMBIOS» y subir los **cuatro archivos** a la **raíz** de GitHub.
4. Confirmar la operación (*Commit changes*).
5. Una vez publicado, actualizar con Ctrl+F5. Si está instalada como PWA, cerrarla y volverla a abrir para tomar la caché nueva.
6. Comprobar un scouting real: Resumen → Fundamentos → Táctica → Búsqueda/Vídeo → Hojas; cambiar filtros, regresar a la misma subpestaña y abrir un rally en el vídeo.

## Pruebas y limitaciones

- 99 pruebas automatizadas aprobadas (91 heredadas + 8 nuevas).
- 137 archivos JS y 79 scripts inline de `index.html` sin errores sintácticos.
- Interfaz aislada probada en Chromium 1440 px y 390 px; 5 áreas, navegación entre subpestañas, filtros de fundamentos, selección de rally, apertura del panel de vídeo, persistencia de subpestaña y ausencia de desbordamiento del documento.
- El navegador del entorno **bloquea** abrir la app completa por URL local o `file:`. No se ha probado todavía el arranque real en GitHub Pages, la carga con todos los scripts simultáneos ni la sincronización Supabase PC–móvil.
- Persisten 11 referencias CSS ausentes **heredadas** del ZIP original. No se han sustituido por hojas vacías; deben revisarse contra el repositorio real.
- El rediseño completo de Partidos, Entrenamientos, Club y Video Studio continúa previsto en etapas posteriores. V19.3.19.4 se centra en **Análisis**.

## Recuperación

Si el cambio visual genera un problema, volver a subir los `index.html`, `191-vc19310-professional-analysis-architecture.js` y `service-worker.js` de V19.3.19.3.1, y retirar solo `vc193194-analysis-workspace.css` si no lo utiliza ya ninguna versión nueva. No restaurar versiones antiguas de datos y no sobrescribir Supabase.
