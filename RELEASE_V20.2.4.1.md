# Volley Coach V20.2.4.1 — Data Volley Layout Refinement

## Punto de partida
Esta actualización está diseñada para **Volley Coach V20.2.4**. Se han reutilizado las mismas instancias de marcador, codificación, pista interactiva, cámara y motor de sincronización. No añade ningún nuevo motor de scouting ni modifica tablas o datos guardados.

## Cambios visibles
- La **barra lateral izquierda** («Inicio», «Club y equipos», «Entrenamientos», «Partidos», etc.) se oculta por defecto al entrar en el Scouting Pro en escritorio. El botón **☰** de la barra superior la abre o vuelve a ocultar. La preferencia de esta vista se recuerda *solo en el navegador/dispositivo*.
- El panel derecho del Scouting Pro permite tres estados desde `Panel: completo`: **completo → compacto → oculto → completo**.
- `Vídeo máximo` oculta temporalmente el panel derecho (sin eliminar sus controles ni su borrador) y extiende el vídeo hasta ocupar todo el ancho. `Restaurar scouting` devuelve el panel.
- `Fuente / cámara` pliega o despliega las opciones Live, Delay, YouTube, archivo y conexión móvil, sin alterar la fuente que esté reproduciéndose.
- Cabeceras, márgenes y paneles se compactan para reservar más superficie de pantalla al vídeo.
- Atajos opcionales: `Alt+Mayús+M` (barra izquierda) y `Alt+Mayús+P` (ciclo del panel derecho). Los atajos existentes del código rápido siguen vigentes.
- En móvil, se conserva el menú nativo y el vídeo y el panel de scouting se apilan verticalmente.

## Actualización GitHub desde V20.2.4
1. **Antes de instalar**, espera a que los cambios locales estén sincronizados y conserva una copia de seguridad JSON de tus scoutings.
2. Abre el ZIP `Volley_Coach_V20.2.4.1_SOLO_SUBIR_GITHUB.zip` y descomprímelo.
3. Sube a la **raíz de GitHub**, al lado de `index.html`, exactamente los siguientes archivos:

| Archivo | Acción |
|---|---|
| `index.html` | Sustituir |
| `service-worker.js` | Sustituir |
| `216-vc20241-data-volley-layout-refinement.js` | Añadir |
| `vc20241-data-volley-layout-refinement.css` | Añadir |
| `214-vc2022-match-intelligence.js` | Añadir si falta / sustituir por la misma versión incluida |
| `vc2022-match-intelligence.css` | Añadir si falta / sustituir por la misma versión incluida |

Los dos últimos archivos se incluyen **deliberadamente** porque una instalación anterior mostró el aviso `No se han cargado ... 214-vc2022-match-intelligence.js`. No se han modificado respecto a la base V20.2.4: permiten reparar una actualización incompleta sin recuperar todo el proyecto.

4. Confirma con **Commit changes**, espera a que termine el despliegue de GitHub Pages y recarga la web con `Ctrl + F5`.
5. No borres otros archivos ni elimines datos locales. En particular, no borres los módulos de sincronización `209–211`, la pantalla 215 ni el editor 196.

## Pruebas recomendadas después de publicar
1. Entra en Partidos → Match Workspace · Scouting. La navegación izquierda debe plegarse. Usa ☰ para abrir/cerrar.
2. Comprueba que el marcador original muestra el mismo tanteo que antes.
3. Cambia el panel derecho de **completo** a **compacto** y confirma que siguen accesibles el código rápido y la pista.
4. Oculta el panel derecho y comprueba que el vídeo se amplía. Restaura y confirma que el texto que estabas escribiendo sigue ahí.
5. Abre Fuente / cámara y comprueba Live, Delay, YouTube o archivo según la fuente que uses.
6. Comprueba con **dos dispositivos físicos** que siguen funcionando los cambios en tiempo real, la presencia y el guardado.
7. Vuelve a Inicio: el menú lateral recupera su funcionamiento anterior fuera del Scouting Pro.

## Validación realizada
- 204 pruebas automatizadas superadas en el proyecto completo.
- Auditoría sintáctica: 148 archivos JavaScript y 79 scripts internos sin errores.
- Chromium aislado: escritorio 1440 × 900, móvil 390 × 844. Paneles, navegación, borrador y marcador conservados durante el cambio de modos; sin errores JavaScript.
- En la prueba aislada el área de vídeo pasa de ~847 px a ~1380 px cuando se oculta el panel derecho y la barra izquierda está plegada. Son medidas de la **maqueta de prueba**; variarán en la aplicación real.
- Falta probar con vídeo real en tu GitHub Pages, sincronización real con Supabase y dispositivos físicos. No se han tocado las funciones de cámara, marcador, puntos, código ni nube.
- La base histórica aún referencia 11 hojas CSS que faltan en los ZIP originales; esta entrega no intenta sustituirlas.

## Recuperación si algo se ve mal
Reinstala `index.html` y `service-worker.js` de **V20.2.4**, recarga con `Ctrl + F5` y conserva tus archivos y datos de scoutings. Eliminar el módulo 216 y la CSS es opcional; al retirar las dos referencias del HTML, dejan de ejecutarse.
