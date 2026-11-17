# Volley Coach V19.3.19.3 — Setter Distribution Pro

**Base real:** V19.3.19.2 COMPLETO. Esta actualización no sustituye ni migra los datos de Supabase; modifica la visualización y el análisis de solo lectura. No crea nuevos repositorios de scoutings.

## Cambios

- **Análisis → Distribution:** dos modos principales, «Distribución consecutiva» y «Distribución sobre bases / Llamadas del colocador».
- **Distribución consecutiva:** seis columnas P1–P6 en orden cronológico por set / rally / acción, resumen de uso, K1, K2, kill y eficiencia, tabla completa de secuencias con botones Rally y Vídeo.
- **Sobre bases:** pista estadística compacta con seis zonas oficiales, proporciones y eficiencia; solo utiliza origen A o destino E explícito según el selector. Las letras F/C/B/P/S solo se muestran si se codificaron.
- **Matrices nuevas:** llamada × zona, llamada × atacante, llamada × tempo, llamada × combinación, colocador × rotación y recepción × zona de ataque. Tabla activa única con pestañas, sin repetir todos los cruces en una página larga.
- **Evidencia verificable:** clic en una celda = rallies que contienen exactamente ambos valores. Clic en «Vídeo» pasa la clave original al Video Analysis ya existente. La exportación CSV respeta el filtro de celda activo.
- **Filtros:** set, K1/K2 (según saque registrado), rotación, fase comprobable, colocador, calidad R, tempo E, atacante, combinación, llamada K y tipo ofensivo codificado.
- **Diseño:** CSS específico y responsivo para escritorio, tablet y móvil; evita las flechas sobredimensionadas y el desbordamiento de la página.
- **Despliegue:** revisión de la versión de los dos recursos Distribution y actualización del nombre de caché del service worker.

## Datos, cálculo y límites

- 1 acción E representa como máximo una secuencia E→A, sin atravesar otra posesión o una recepción intermedia.
- K1 / K2 solo se atribuyen cuando el equipo al saque está registrado (`servingBefore`). K1 = recepción; K2 = fase de saque, sin garantizar que cada acción sea un contraataque.
- Kill % = ataques `#` / ataques evaluados. EFF = (`#` − `=` − `/`) / ataques evaluados. Sin valoración, el dato no entra en el denominador.
- Los porcentajes de las celdas se calculan respecto a la muestra con la **columna de interés codificada dentro de la fila**, no respecto a todas las acciones. El número excluido de los cruces se muestra aparte.
- **No** se infieren recorridos de centrales, llamadas, zonas, marcadores, jugadores ni vídeos inexistentes.
- No se ha alterado la sincronización de Supabase, edición de contactos, vídeo real ni la presencia de dispositivos.

## Archivos de producto modificados

1. `198-vc193161-distribution-intelligence.js`
2. `vc193161-distribution-intelligence.css`
3. `index.html` (versiones de recursos)
4. `service-worker.js` (caché)

## Verificación

- Suite de regresión: 88 pruebas Node aprobadas.
- Chromium aislado: seis rotaciones, dos modos, seis matrices, selección de celda, filtros K1/K2, navegación a vídeo, exportación y anchura móvil/escritorio verificadas.
- Prueba histórica aislada V19.3.16.1: aprobada.
- Sintaxis de todos los archivos JS de distribución comprobada y pruebas del resto de módulos conservadas.

**Pendiente:** prueba integral publicada con un partido real, vídeo real, sesiones de PC y móvil y Supabase; revisión de 11 referencias CSS históricas no incluidas en el ZIP V19.3.19.2. La interfaz es funcionalmente similar a un flujo profesional de Data Volley, pero no es una reproducción certificada o idéntica a Data Volley 4.
