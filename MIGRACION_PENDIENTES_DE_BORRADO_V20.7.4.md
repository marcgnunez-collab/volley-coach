# Volley Coach · Limpieza final pendiente tras V20.7.4

## NO BORRAR NINGÚN ARCHIVO TODAVÍA

La migración está en curso. La decisión actual es mantener todos los archivos antiguos en GitHub hasta finalizar las pruebas y reunir **una sola lista de eliminación definitiva**.

El archivo `scripts/retained-legacy-assets.json` reúne **32 candidatos** identificados hasta ahora. Ninguno debe eliminarse todavía.

| Bloque | Candidatos a revisar al final | Situación actual |
| --- | ---: | --- |
| V20.7.0 | 10 | Duplicados históricos, iconos y pruebas redundantes; no se cargan en la app |
| V20.7.1 | 10 | CSS antiguos consolidados en cuatro estilos nuevos |
| V20.7.2 | 3 | Módulos de análisis táctico consolidados en uno |
| V20.7.3 | 3 | Módulos de diagnóstico y comprobación previa consolidados en uno |
| V20.7.4 | 6 | Cuatro JS y dos CSS del centro del club consolidados en dos |

**Total: 32 candidatos**, no 32 eliminaciones hechas. En la versión fuente V20.7.4 todavía se conservan físicamente los 9 identificados en V20.7.3 y V20.7.4; los anteriores pueden seguir presentes en tu repositorio remoto. La auditoría de publicación permite cualquiera de esos archivos antiguos solo si está identificado en el inventario y no vuelve a aparecer como recurso activo.

## Condiciones antes de borrar al final

1. Finalizar la migración estructural de las interfaces y los módulos de datos críticos.
2. Verificar el despliegue real y la navegación en ordenador y móvil.
3. Probar un scouting completo con puntos, deshacer, vídeo REC/Delay y sincronización entre dispositivos, conservando una copia de seguridad de los datos.
4. Confirmar que ningún módulo nuevo ni personalizado necesita alguno de los nombres listados.
5. Preparar un único ZIP final, una única relación definitiva de archivos sobrantes y un procedimiento reversible de limpieza.

Mientras tanto, instala las siguientes versiones con SOLO_CAMBIOS **sin eliminar archivos**.
