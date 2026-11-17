# Guía de uso · Volley Coach V19.3.17 Video Montage Pro

## 1. Preparación

1. Entra en **Análisis** y selecciona el scouting correcto.
2. Abre **Video Montage**, entre Video Analysis y Worksheets.
3. Confirma que el nombre del partido coincide con la grabación. Usa **Abrir archivo** para cargar un archivo local de tu equipo, o **Abrir REC** para buscar una grabación previamente guardada en este dispositivo.
4. El vídeo mostrado es el mismo motor de Video Review utilizado por Video Analysis; no se crea ninguna copia física del archivo.

## 2. Crear el montaje

En **Mis montajes**, escribe un nombre descriptivo y pulsa **Nuevo montaje**. Selecciona uno guardado para continuar editándolo. Puedes renombrarlo o eliminarlo; eliminar un montaje no borra scoutings ni archivos de grabación.

## 3. Incorporar jugadas

Hay tres vías:

- **Rally**: selecciona un rally de la lista y pulsa **Añadir rally seleccionado**. El sistema necesita un intervalo verificable en el Video Review del partido; si no existe, avisa y no inventa tiempos.
- **Clips del catálogo**: elige un clip guardado o automático y pulsa **Añadir clip seleccionado**. Los clips siguen enlazados al catálogo original.
- **Playlist existente**: selecciona una playlist táctica creada previamente en Clip Studio Pro y pulsa **Incorporar playlist**. Las jugadas se añaden respetando su orden. Los clips sin tiempos válidos se omiten.

**Añadir rallies del filtro** incorpora los rallies del análisis actual con marcas de vídeo válidas. Un montaje admite hasta 120 segmentos. Para recopilar jugadas de otro partido, crea un montaje específico para ese partido; esta versión todavía no combina fuentes de varios partidos en un único vídeo.

## 4. Ordenar la línea de tiempo

Selecciona una fila para ver el clip. Usa **↑**, **↓**, **Duplicar** y **Quitar** para reordenar o repetir jugadas. En **Edición del segmento**, establece el inicio y final en segundos, y una velocidad de 0,5×, 1× o 1,5×. Pulsa **Guardar intervalo y velocidad**. No se modifican las marcas del scouting original.

## 5. Dibujar y añadir texto

Elige el segmento deseado. En **Herramientas de anotación**, selecciona flecha, línea, círculo, rectángulo, mano alzada o texto. Elige un color y, para textos sobre la pista, escribe antes el contenido. Dibuja directamente sobre el reproductor. Las anotaciones quedan vinculadas únicamente al segmento seleccionado; aparecen también en el vídeo WebM exportado. Puedes deshacer el último dibujo o limpiar todos los dibujos del segmento.

En **Título / nota del clip**, escribe un texto que se muestre en la zona inferior del vídeo. Sal del campo para guardar el cambio. Selecciona **Solo reproducir** al terminar de dibujar para volver a controlar el reproductor con normalidad.

## 6. Previsualización

Pulsa **Reproducir selección** para revisar el segmento seleccionado, o **Montaje completo** para pasar por los segmentos en el orden de la línea de tiempo. **Detener** pausa la previsualización. Los tiempos se basan en las referencias de vídeo del scouting y los cortes ajustados manualmente.

## 7. Exportaciones

- **Exportar montaje WebM**: crea un único vídeo con los segmentos en el orden indicado, incluyendo dibujos, títulos y velocidad. La exportación es **en tiempo real** y admite hasta diez minutos de duración final.
- **Exportar clip seleccionado**: genera solo el segmento activo en formato WebM.
- **Exportar montaje JSON**: exporta la definición y las referencias del montaje sin copiar el vídeo.
- **Exportar EDL CSV**: exporta la lista de cortes, velocidades y anotaciones. No contiene vídeo.

Para WebM usa una grabación local que se pueda reproducir en el navegador y mantén la pestaña visible. Si el navegador no tiene MediaRecorder/captureStream o la fuente no permite dibujar, la aplicación mostrará una advertencia y conservará las referencias. YouTube, LIVE y Delay temporal no se exportan por esta vía. Según el navegador, el archivo puede no conservar sonido; comprueba siempre el resultado.

## 8. Verificaciones recomendadas antes de publicar

Revisa que corresponda al partido elegido, que las zonas y contactos estén bien codificados, que el rango IN/OUT no corte la jugada, que las flechas sigan siendo legibles y que la velocidad no modifique accidentalmente la interpretación técnica. Prueba además la sincronización entre PC y móvil y conserva una copia JSON de los scoutings antes de usarlo en partidos reales.

## 9. Referencia de Data Volley 4

Data Volley 4 permite elaborar montajes a partir de varias búsquedas, ordenar acciones en una línea de tiempo, insertar textos y dibujos, reproducir clips y exportar vídeo. Volley Coach V19.3.17 sigue ese tipo de flujo, pero no reproduce todas las opciones de Data Volley ni su exportación de formatos profesionales. Referencia: https://www.dataproject.com/Products/us/en/volleyball/DataVolley4
