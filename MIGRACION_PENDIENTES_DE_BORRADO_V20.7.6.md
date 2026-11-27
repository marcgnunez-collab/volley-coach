# Volley Coach V20.7.6 · Archivos antiguos pendientes de limpieza final

**No eliminar ningún archivo en GitHub hasta acabar toda la migración.**

El inventario en `scripts/retained-legacy-assets.json` mantiene los mismos
**37 candidatos** que en V20.7.5:

| Fase | Candidatos |
| --- | ---: |
| V20.7.0 · auditoría de recursos | 10 |
| V20.7.1 · CSS consolidado | 10 |
| V20.7.2 · tácticas unificadas | 3 |
| V20.7.3 · diagnósticos unificados | 3 |
| V20.7.4 · club y workspace | 6 |
| V20.7.5 · análisis y revisión | 5 |
| **Total** | **37** |

En V20.7.6 se separan **siete constantes de datos** del archivo de entrenamiento
vigente en un módulo nuevo. Esto **no añade ningún archivo a la lista de borrado**:
`002-core-training-v150-monolithic.js` sigue siendo parte esencial de la aplicación.

La decisión de retirada se hará al final de la migración tras revisar las rutas
HTML/PWA reales, datos persistidos, guardado y recuperación, dispositivos y
referencias históricas. Subir `SOLO_CAMBIOS` no elimina archivos antiguos;
la auditoría los admite explícitamente mientras estén inventariados.
