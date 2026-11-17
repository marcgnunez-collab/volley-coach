# Volley Coach · Release V20.1.1

Mantenimiento de sincronización: diario local duradero por lotes (`IndexedDB`), guardado previo a envío CAS, confirmación de lote solo tras respuesta de nube y bloqueo de lecturas de riesgo. Integra con el escritor cloud existente sin modificar Supabase ni realizar migraciones de datos.

La interfaz del diario se encuentra bajo **Dispositivos y nube**. Consulta `GUIA_INSTALACION_V20.1.1.md` y `AUDITORIA_SYNC_V20.1.1.md` para la instalación y las limitaciones. Se mantiene la separación entre `Realtime`, lectura de nube y escritura confirmada. No se sincronizan vídeo ni blobs.

Tests: 151 automatizados aprobados, 142 módulos JS y 79 bloques internos compilados. Validación con dos dispositivos y Supabase real pendiente. No afirmar fiabilidad comercial definitiva.
