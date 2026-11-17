# Volley Coach V20.1.1 · Guía de instalación

## Punto de partida

Actualiza **únicamente si GitHub ya tiene V20.1.0 completa**. La entrega incremental no incluye versiones anteriores que falten en el repositorio.

## Antes de subir archivos

1. Detén cualquier partido en directo y evita que dos dispositivos editen mientras se publica la actualización.
2. En cada PC o móvil con datos propios, abre **Copias protegidas / Exportar JSON** y guarda una copia fuera del navegador. Verifica que puedes abrir el JSON y que contiene `equiposData`.
3. Comprueba si el diagnóstico de V20.1.0 informa cambios pendientes, conflictos o una cuenta diferente. Si los hay, conserva una copia de ambos dispositivos antes de tocar nada.
4. Descarga también una copia de seguridad del repositorio de GitHub.

## Archivos que hay que subir a GitHub

Descomprime **Volley_Coach_V20.1.1_SOLO_SUBIR_GITHUB.zip** y sube exactamente los cinco archivos de su raíz a la raíz del repositorio:

| Archivo | Acción |
|---|---|
| `index.html` | Sustituir |
| `service-worker.js` | Sustituir |
| `209-vc2001-sync-reliability.js` | Sustituir |
| `210-vc2011-durable-sync-journal.js` | Añadir |
| `vc2011-durable-sync-journal.css` | Añadir |

No subas el ZIP como un único archivo ni crees una carpeta `volley-coach-main` dentro del repositorio. **No elimines ningún módulo anterior.** El ZIP completo sirve como referencia o para restaurar un repositorio de pruebas completo, no para sobrescribir a ciegas datos reales.

## Publicación y comprobación

1. En GitHub, abre tu repositorio → **Add file → Upload files** (o sustituye cada archivo en su ruta original) → **Commit changes**.
2. Espera a que GitHub Pages indique que el despliegue se ha publicado.
3. Actualiza los dos dispositivos (PC y móvil) antes de reanudar las ediciones simultáneas. En navegador web, `Ctrl + F5`; en una PWA instalada, ciérrala y ábrela tras comprobar la versión.
4. Abre **Dispositivos y nube**. Debe aparecer **Diario durable de sincronización · V20.1.1** bajo el panel existente.
5. Con datos **de prueba**, modifica una acción, comprueba la indicación de pendiente y vuelve a sincronizar. Confirma que desaparece el lote pendiente solo después de la subida CAS.
6. Desconecta Internet, edita un dato de prueba, vuelve a conectar y comprueba la recuperación. Después repite en el segundo dispositivo comprobando que la acción aparece sin duplicación.
7. Si el nuevo panel indica **revisión necesaria**, descarga el último lote y no fuerces importaciones que puedan borrar datos.

## Qué no hace V20.1.1

- No añade tablas ni políticas RLS nuevas en Supabase.
- No sincroniza imágenes o grabaciones de vídeo entre equipos.
- No hace replay remoto independiente de cada contacto: Supabase conserva el estado completo por cuenta con control CAS.
- No resuelve automáticamente ediciones concurrentes incompatibles.
- Las copias en IndexedDB pertenecen al navegador local; borrar datos del sitio podría eliminarlas.

## Cómo revertir

Restaura los cinco archivos desde el commit anterior **solo tras conservar los JSON pendientes de cada dispositivo**. No borres IndexedDB ni los datos locales para resolver un conflicto. Si necesitas recuperar un estado, usa la importación manual existente después de comparar copias y confirmar qué versión deseas conservar.
