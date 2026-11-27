# Volley Coach · Próximos bloques grandes de arquitectura

Mediciones sobre la fuente V20.7.4, antes de minificar/compilar. El objetivo es **reducir la estructura y el peso real**, no solo el número de etiquetas o el tamaño de los ZIP incrementales.

| Origen | Tamaño fuente aproximado | Próximo trabajo seguro |
| --- | ---: | --- |
| `index.html` | 1 837 427 bytes | Extraer scripts embebidos autónomos, separar presentación y lógica, conservar exactamente su orden de inicio |
| `021-core-scouting-v150-monolithic.js` | 749 211 bytes | Mapear escritores reales, separar cálculos/lectores puros; migración gradual con pruebas de paridad y recuperación |
| `002-core-training-v150-monolithic.js` | 647 727 bytes | Separar vistas, cálculo y persistencia; nunca iniciar una segunda ruta de guardado |
| `165-vc1851-match-center-pro.js` | 176 396 bytes | Revisar duplicación de UI y dependencias con Scouting/Match Mode |
| `124-vc16155-analyst-studio.js` | 176 380 bytes | Revisar filtros y proyecciones que puedan pasar al dominio TypeScript existente |

La fuente actual tiene aproximadamente **155 etiquetas de scripts externos, 28 enlaces CSS y 77 bloques de scripts embebidos** en `index.html`. Son métricas del HTML, no una afirmación sobre solicitudes efectivas tras Vite.

## Orden propuesto

1. Construir un mapa de arranque/dependencias y clasificar cada bloque como vista, consulta pura, coordinación o escritura. No marcar como prescindible un módulo solo por su nombre histórico.
2. Extraer del HTML los bloques independientes y verificarlos con comparación exacta de la ruta original y la nueva. Mantener la navegación, CSS, Scouting, vídeo y soporte PWA.
3. Para los monolitos, transferir primero las proyecciones puras a TypeScript con rutas de respaldo, sin duplicar propietarios de datos ni cambiar claves locales.
4. Cambiar progresivamente adaptadores efectivos y medir en la versión publicada; requerir pruebas reales de puntos, deshacer, REC/Delay, IndexedDB y dos dispositivos antes de tocar escrituras.
5. Cuando la migración esté terminada, consolidar build, retirar alias temporales, comprobar el inventario y entregar una sola lista final de archivos que se podrán borrar de GitHub.

**Regla actual:** no borrar nada hasta completar la migración, aunque el archivo ya no se cargue. El inventario `scripts/retained-legacy-assets.json` lleva 32 nombres al cierre de V20.7.4.
