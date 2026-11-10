# Volley Coach · V17.5.3

Aplicación de entrenamientos, scouting, vídeo y análisis de voleibol. Abre `index.html` desde la web publicada mediante HTTPS. Los módulos JavaScript y archivos PNG deben estar en la misma raíz.

**Sincronización:** se mantiene el motor clásico de V16.5.4, sin cambios en `083-v138-realtime-mobile-runtime.js` y `108-vc16040-sync-pro.js`. El indicador de dispositivos conectados no implica por sí solo que una modificación se haya subido y descargado.

## Publicar

1. Guarda copias JSON de los datos desde PC y móvil.
2. Publica todos los archivos de la versión, incluida `vc17-workspace.css`.
3. Si estás actualizando desde V17.3.0, elimina **del despliegue** los tres módulos indicados en `README_V17.4.0.md`, después de guardar su ZIP de respaldo.
4. Tras el despliegue, recarga ambos dispositivos y verifica un entrenamiento de prueba entre PC y móvil.

## Verificar antes de publicar

Requiere Node.js 22+ y Python 3.10+:

```bash
python3 tools/verify_release.py
python3 tools/audit_v17_workflows.py
node --test tests/*.test.cjs
```

El flujo `.github/workflows/verify-release.yml` ejecuta la auditoría y las pruebas Node en GitHub Actions. Las pruebas visuales aisladas (`tests/smoke-*.py`) requieren Playwright/Chromium y no son una prueba de sincronización real.

Más información: `INFORME_LIMPIEZA_V17.4.0.md`.


### V17.5.3 · Ruta automática y pantalla grande

- La pista 9×4 inicia en modo automático: primer toque = origen y segundo toque en una casilla diferente = destino. Las subzonas siguen C/B/D/A según la orientación previa.
- Origen y destino quedan marcados visualmente; la ruta solo se añade al scouting al pulsar «Añadir» o Enter (no se crean rallies ni puntos desde la pista). «Solo destino» mantiene la edición manual.
- El botón «Pantalla grande» vuelve a la cabecera del reproductor y se recupera tras reconstruir la cabecera. La vista ampliada conserva el panel de codificación, sin duplicar el reproductor.
- Se cambia la versión de los scripts afectados en `index.html` y la caché del service worker.
