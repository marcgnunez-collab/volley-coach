# Volley Coach V19.3.18 · Worksheets & Reports Pro

## Acceso

1. Abre **Scouting / Análisis**.
2. Selecciona un partido en la barra superior y el equipo que quieres analizar.
3. Entra en **Worksheets**. Las tablas se reconstruyen desde los contactos del scouting que cumplen los filtros superiores del análisis.

## Crear una hoja personalizada

1. Selecciona una **Plantilla** (Ataque, Recepción, Saque, Rotaciones, Colocadores o General) y pulsa **Aplicar plantilla**.
2. Filtra por **Fundamento, Agrupar, Set, Rotación, Fase K1/K2, Jugador, Valoración y Zona**. Los filtros se combinan mediante AND: cada contacto debe satisfacer todos los filtros elegidos.
3. Pulsa **Personalizar columnas**. Marca o desmarca las métricas. No se puede crear una tabla sin ninguna columna.
4. Si necesitas un cálculo propio, escribe una **Fórmula segura** y pulsa **Aplicar**. Solo permite números, paréntesis, +, -, *, / y las variables admitidas; no ejecuta JavaScript. La división entre cero produce «—».
5. Pulsa **Guardar nueva** para conservar la configuración en el navegador actual. No guarda los resultados del partido y no sincroniza las plantillas con otros dispositivos.

## Cómo interpretar las cifras

- **Acciones**: número de contactos que cumplen los filtros, sin contar por segunda vez los contactos por estar en más de un rally.
- **Valoradas**: contactos con código de valoración reconocido.
- **Sin valorar**: contactos de la muestra sin valoración reconocida.
- **Valoración #**: calidad `#` registrada; no significa automáticamente un punto del marcador.
- **Ataques # / Kill %**: ataques A evaluados con `#`, y porcentaje `# / ataques evaluados`.
- **EFF ataque**: `100 × (ataques # − ataques = − ataques /) / ataques evaluados`.
- **Recepción positiva**: `100 × (recepciones # o +) / recepciones evaluadas`.
- **Saques # %**: `100 × (saques #) / saques evaluados` (valoración de saque, no necesariamente un punto de partido).
- **K1**: rallies con saque rival; porcentaje de rallies cerrados ganados por el equipo seleccionado sobre rallies cerrados con saque rival conocido de esta muestra.
- **K2**: rallies con saque propio; mismo cálculo con saque propio conocido.
- **«—»**: no hay denominador suficiente, no es 0 %.

**Limitación de la base actual:** la proyección de análisis V19.3.8 excluye rallies que todavía no se han cerrado. Las cifras pueden cambiar cuando se finaliza un rally o cuando se corrige un contacto. Se debe actualizar el análisis después de esas operaciones.

**Zona explícita:** para acciones A representa el origen de ataque; para E el destino codificado de colocación; para R la zona de contacto u origen. No es correcto interpretar las zonas de fundamentos distintos como una única variable homogénea.

## Analizar los datos y abrir el vídeo

1. Revisa las filas por jugador, rotación, set, zona u otra agrupación.
2. Pulsa el **nombre de una fila** para aislar sus rallies. Pulsa de nuevo para eliminar esa selección.
3. En **Evidencia vinculada**, pulsa **Ver vídeo** sobre un rally: se abre `Video Analysis` con el rally seleccionado.
4. La reproducción solo funciona si el vídeo del partido está vinculado y disponible en el dispositivo. La hoja no copia vídeos ni inventa intervalos.

## Guardar y compartir

- **CSV**: tabla actual con grupos, columnas y número de rallies. Protege los nombres que puedan interpretarse como fórmulas al abrirla en una hoja de cálculo.
- **Informe HTML**: página autocontenida y printable con la tabla, contexto y definiciones; se abre en el navegador.
- **Imprimir / PDF**: abre una ventana con ese informe y solicita imprimir. En el diálogo del navegador puedes elegir *Guardar como PDF*. No se trata de una exportación PDF nativa.
- **Exportar plantilla**: crea un archivo JSON con nombres, filtros, columnas y fórmula, pero **sin datos personales ni estadísticas del partido**.
- **Importar JSON**: valida el archivo de plantilla V19.3.18 antes de guardarlo localmente.
- **Plantillas anteriores**: las plantillas `vc19311` conservadas en el navegador aparecen en el menú bajo “Plantillas V19.3.11 anteriores” y se cargan en modo lectura. No se sobrescriben automáticamente.
- **Hojas anteriores / Informes anteriores**: botones para acceder a las funciones anteriores.

## Compatibilidad y restricciones

- Implementado sobre V19.3.17 completa, sin reemplazar los motores del scouting, REC, Delay, marcadores ni Supabase.
- Un cambio de código se refleja al regenerar los datos de análisis: no existe un caché estadístico independiente que pueda sobrescribir el scouting.
- Los resultados se generan por partido/equipo, no es todavía un panel agregado de temporada ni una auditoría de compatibilidad de archivos de Data Volley.
- Prueba del módulo aislado en Chromium y pruebas unitarias no equivalen a validar una sesión real PC–móvil–Supabase. Esa prueba sigue pendiente.
