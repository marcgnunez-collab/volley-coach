# Volley Coach · Estado de archivos pendientes en V20.7.5

## NO BORRAR NADA HASTA TERMINAR LA MIGRACIÓN

Ahora hay **37 candidatos** a limpieza final en `scripts/retained-legacy-assets.json`. Algunos siguen presentes en la versión fuente, otros pueden permanecer en GitHub y otros quizá se hayan retirado en una publicación anterior. Ninguno debe borrarse por separado en esta fase.

| Fase | Candidatos acumulados de esa fase | Motivo |
| --- | ---: | --- |
| V20.7.0 | 10 | Recursos y pruebas históricos duplicados |
| V20.7.1 | 10 | CSS antiguos ya consolidados |
| V20.7.2 | 3 | Módulos de análisis táctico unificados |
| V20.7.3 | 3 | Diagnósticos y comprobación previa unificados |
| V20.7.4 | 6 | Navegación, contratos y centro del club unificados |
| V20.7.5 | 5 | Análisis profesional, montaje, informes y banquillo consolidados |

En V20.7.5 también se extrae un bloque de estilos del propio `index.html` a un archivo CSS nuevo. Ese bloque no era un archivo independiente antiguo, por lo que **no se añade a la lista de eliminación**.

## Antes de la limpieza definitiva

1. Completar la migración de los bloques pesados, incluidos `index.html`, Scouting y Entrenamientos.
2. Comprobar la app publicada en PC y móvil con vídeo, puntos, deshacer, entrenamiento, recuperación, IndexedDB y sincronización entre dos dispositivos.
3. Guardar copias completas y exportaciones de datos de los clubes.
4. Revisar personalizaciones del repositorio y resolver qué dependencias siguen activas.
5. Entregar una **única lista definitiva** de archivos confirmados para borrar, con copia recuperable y pruebas posteriores.

Hasta entonces, sigue publicando solo `SOLO_CAMBIOS` en orden y **no borres archivos antiguos**.
