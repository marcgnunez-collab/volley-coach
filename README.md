> **V20.5.9 · Estado centralizado observable (lectura):** proyección TypeScript ligera de marcador, saque, rotaciones y rallies, con suscripciones selectivas y un único punto de escucha del estado original. Los diagnósticos V20.5.5 y V20.5.7 reutilizan el hub; hay un nuevo panel en **Gestión → Lectura unificada del partido**. El marcador, los registros y la nube siguen bajo control del código existente. [Guía e instalación](GUIA_V20.5.9_ESTADO_OBSERVABLE.md). Base: **V20.5.8**.

> **V20.5.8 · Gramática modular de códigos rápidos:** ampliación TypeScript de la sintaxis existente (subzonas, conos, saque, dirección, colocación, tempo y metadatos avanzados), contrastada con parsers históricos. Nuevo panel **Gestión → Referencia de código rápido** sin registrar ni modificar acciones. [Guía e instalación](GUIA_V20.5.8_GRAMATICA_CODIGOS.md). Base: **V20.5.7**.

> **V20.5.7 · Auditoría de acciones registradas:** nuevo panel en **Gestión** para examinar, solo bajo demanda, códigos ya guardados en el scouting local, trazas de puntos y continuidad de rotaciones. Aviso de informe desactualizado, exportación JSON anónima y límites para partidas grandes. No toca el registrador, marcador ni sincronización. [Guía e instalación](GUIA_V20.5.7_AUDITORIA_REGISTROS.md). Requiere **V20.5.6**.

> **V20.5.6 · Validación paralela del scouting:** el resultado de la previsualización nativa se compara con el nuevo módulo TypeScript sin repetir la llamada al parser ni registrar acciones. Panel en **Gestión → Comparación de códigos · sesión actual**, contadores de discrepancias y descarga JSON sin datos de jugadores. Guía: [GUIA_V20.5.6_VALIDACION_PARALELA.md](GUIA_V20.5.6_VALIDACION_PARALELA.md). Instalación incremental sobre **V20.5.5**.

> **V19.3.19.3 · Setter Distribution Pro:** rediseño de Análisis → Distribution con distribución consecutiva P1–P6, seis matrices cruzadas y pista compacta. Clic en celda para rallies originales y vídeo; filtros Set/K1/K2 y cálculo sobre datos reales. Ver [guía](GUIA_SETTER_DISTRIBUTION_V19.3.19.3.md) y [notas](RELEASE_V19.3.19.3.md). Base de instalación: **V19.3.19.2 completa**.

> **V19.3.19.1 · Professional Architecture & Unified Workspace:** navegación de seis áreas operativas más Configuración, barra Match Workspace, proyección de datos de solo lectura, auditoría y exportación/validación de respaldo. Sin migración ni escrituras a Supabase. [Notas](RELEASE_V19.3.19.1.md), [auditoría](docs/ARCHITECTURE_AUDIT_V19.3.19.1.md), [contrato](docs/DATA_CONTRACT_V19.3.19.1.md).

> **V19.3.19 · Bench Client Pro:** nueva vista de solo lectura para cuerpo técnico dentro de Banquillo Pro. Marcador registrado, K1/K2, rotaciones, últimas jugadas, detalle de contactos y consulta en otro dispositivo con la misma sesión. Ver [guía](GUIA_BENCH_CLIENT_V19.3.19.md) y [notas técnicas](RELEASE_V19.3.19.md).

> **Actualización V19.3.18:** Worksheets & Reports Pro integrado en Análisis con tablas personalizables, plantillas e informes HTML/CSV y plantillas JSON. Guía: [GUIA_WORKSHEETS_REPORTS_V19.3.18.md](GUIA_WORKSHEETS_REPORTS_V19.3.18.md). Notas: [RELEASE_V19.3.18.md](RELEASE_V19.3.18.md).

> **Actualización V19.3.17:** Video Montage Pro integrado en Análisis. Guía: [GUIA_VIDEO_MONTAGE_V19.3.17.md](GUIA_VIDEO_MONTAGE_V19.3.17.md). Notas: [RELEASE_V19.3.17.md](RELEASE_V19.3.17.md).

> **V19.3.16.3 · Distribution Intelligence Pro:** tablas consecutivas por rotación, matrices de llamadas y navegación directa a vídeo. Ver `RELEASE_V19.3.16.3.md` y `GUIA_DISTRIBUTION_INTELLIGENCE_V19.3.16.3.md`. Base de instalación: V19.3.16.1 completa, NO el ZIP completo V19.3.16.2 antiguo.

## V19.3.16.1 · Distribution Intelligence Pro (15/11/2026)

La pestaña **Análisis → Distribution** incluye ahora **Distribución consecutiva P1–P6** y **Distribución por llamadas K**. Conserva como fuente los contactos y rallies originales; incluye filtros, zonas de ataque/colocación explícitas, vídeo vinculado, CSV y guía detallada. **No equivale todavía al 100% a Data Volley 4**: los recorridos gráficos del central y la exportación de imagen requieren datos/funciones adicionales.

Guía: `GUIA_DISTRIBUTION_INTELLIGENCE_V19.3.16.1.md` · Notas técnicas: `RELEASE_V19.3.16.1.md`.

# Volley Coach · V19.3.16 · Smart Scouting & Match Reliability Pro

Actualización incremental sobre V19.3.15 con asociaciones por secuencia de contactos, atajos de valoración, pista 9×4 integrada en el editor, auditoría local de partido y protección de guardados frente a cambios concurrentes.

**Instrucciones y limitaciones:** [`RELEASE_V19.3.16.md`](RELEASE_V19.3.16.md). La prueba real de Supabase con PC y móvil y la prueba completa de partido están pendientes. El ZIP de origen carece de 11 CSS referenciados; no borres los CSS auténticos del repositorio al publicar.
