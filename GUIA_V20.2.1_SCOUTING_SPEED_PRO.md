# Volley Coach V20.2.1 · Scouting Speed Pro

## Punto de partida

Actualización **incremental desde V20.2.0**, sin cambiar el motor de sincronización V20.1.2.

## Archivos que hay que subir a GitHub

Descarga y descomprime `Volley_Coach_V20.2.1_SOLO_SUBIR_GITHUB.zip`. Sube estos **cuatro archivos a la raíz** del repositorio, no el ZIP:

| Archivo | Acción |
|---|---|
| `index.html` | Sustituir |
| `service-worker.js` | Sustituir |
| `213-vc2021-scouting-speed-pro.js` | Añadir |
| `vc2021-scouting-speed-pro.css` | Añadir |

**No borres ni reemplaces ningún otro archivo.** El ZIP completo solo hace falta para reconstruir el proyecto o comparar toda la versión, no para actualizar directamente desde V20.2.0.

1. Antes de subir nada, exporta copias JSON/VCX verificables **de PC y móvil** y conserva las grabaciones de vídeo por separado.
2. En GitHub: repositorio → Add file → Upload files → arrastra los cuatro archivos extraídos → Commit changes.
3. Comprueba que la publicación de GitHub Pages ha terminado. Actualiza con Ctrl+F5 (en la PWA, cierra y vuelve a abrir). No borres el almacenamiento local ni IndexedDB para intentar forzar la actualización.
4. Entra en Partidos → Scouting → Código directo o Vídeo + scouting. Abre un partido de prueba, verifica la nueva barra Scouting Speed Pro y revisa la sincronización desde los dos dispositivos.

## Cómo se utiliza

La barra de velocidad usa los dos **campos originales** (`v800-code` y `v113-video-code`). Según el modo de partido, utiliza el que esté visible.

- Selecciona el dorsal y pulsa S, R, E, A, B, D, F o C. Si el código ya contiene un fundamento, lo cambia sin borrar la valoración, las zonas ni los modificadores.
- Selecciona una valoración `#`, `+`, `!`, `-`, `/` o `=`. Solo cambia ese carácter en el borrador.
- «Repetir último código» recupera un código existente del **partido activo**; nunca crea una acción nueva por sí solo.
- «Deshacer borrador» revierte únicamente la última edición hecha desde Speed Pro, siempre que el texto no haya cambiado entretanto.
- «Foco código» y «Ir a pista» facilitan navegar al campo original o a su teclado de zonas. «Atajos» abre la configuración existente de macros `Alt+1–8`.
- Al escribir en minúsculas en los campos originales, las letras se normalizan a mayúsculas mientras no se esté componiendo texto IME.

### Atajos adicionales (con el cursor en el campo de código)

| Atajo | Acción |
|---|---|
| `Alt+1` a `Alt+8` | Macros configurables existentes (sin cambios) |
| `Alt+↑` | Recuperar códigos anteriores del partido actual, uno por pulsación |
| `Alt+.` | Pasar a la siguiente valoración (`#`, `+`, `!`, `-`, `/`, `=`) |
| `Alt+Mayús+.` | Retroceder a la valoración anterior |
| `Alt+Mayús+Retroceso` | Deshacer la última modificación de borrador de Speed Pro |
| `Enter` / «Añadir» | **Registro normal existente**: no lo ejecuta Speed Pro |

No se generan puntos, acciones, cambios de rotación, grabaciones ni escrituras en Supabase al pulsar estas herramientas. Se limita a preparar texto para el registro original.

## Qué se ha comprobado

- **178 pruebas automatizadas superadas**, incluyendo diez pruebas nuevas.
- 145 archivos JavaScript y 79 scripts embebidos en `index.html`: sin errores de sintaxis.
- Prueba funcional aislada en Chromium (HTML inyectado en entorno de pruebas): edición, valoración, deshacer, atajos y estado finalizado; se verificó que no hay desbordamiento horizontal a 1366 px ni 390 px.
- El entorno bloqueó la apertura directa de la aplicación completa por URL local, por lo que falta validarla publicada en GitHub Pages con el scouting y la sincronización reales.
- Se mantienen **11 referencias a hojas CSS antiguas ausentes del ZIP de partida**. No se han sustituido por archivos vacíos.

## Comprobaciones de regresión antes de darla por estable

1. En un partido **de prueba**, comprueba que pulsar S/R/E/A etc. cambia **solo el borrador**.
2. Confirma que «Añadir»/Enter sigue registrando una única acción, y que los puntos no aumentan dos veces.
3. Prueba las zonas A/B/C/D, el modo Vídeo + scouting y el campo de Código directo.
4. Reabre Revisión y comprueba que los contactos registrados son los correctos.
5. Con PC y móvil conectados, comprueba que **la acción registrada** se sincroniza y que la barra de velocidad no envía nada por sí sola.
6. Prueba que un scouting finalizado no admita cambios desde Speed Pro.

## Reversión

Guarda el ZIP completo de V20.2.0. Si falla el despliegue, restaura **`index.html` y `service-worker.js` de V20.2.0**; los dos archivos nuevos de Speed Pro pueden permanecer inactivos, pero puedes eliminarlos una vez confirmado el rollback. No borres los datos locales para revertir el código.
