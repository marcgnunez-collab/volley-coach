# Volley Coach V20.5.38 · Extensiones del parser de Scouting en TypeScript

**Base: V20.5.37.** Esta actualización sigue la migración incremental a módulos ES6/TypeScript compilados mediante Vite.

## Funciones trasladadas

El nuevo módulo `src/domain/scout-grammar-extensions.ts` interpreta la estructura de tres extensiones históricas:

1. **Subzonas 1A–9D**: detecta el código, elimina temporalmente la letra para que lo procese el parser base, y devuelve las dos zonas originales para restaurarlas después.
2. **Conos C1–C8**: reconoce el destino de ataque a cono, conserva la subzona de origen y extrae el identificador del cono.
3. **Modificadores avanzados**: extrae código de ataque/llamada de colocador (`::`), tempo (`~`), subtipo (`%`), tipo de colocación (`|`), código especial (`?`) y personalizado (`$`).

Cada envoltorio del parser antiguo consume el resultado TypeScript cuando coincide exactamente con el resultado del selector clásico. Si falla, no se encuentra o difiere, se usa el selector histórico. Las pruebas cubren miles de combinaciones sintéticas y la secuencia real de envoltorios.

## Qué permanece sin cambios

- Lectura base de equipo, dorsal, fundamento, evaluación y zonas V20.5.37.
- Resolución del dorsal y jugadores, normalización y construcción final de la jugada.
- Escritura de rallies, marcador, rotaciones, sustituciones, deshacer y estadísticas.
- Vídeo, metadatos de clips, IndexedDB, Supabase y diario CAS de sincronización.

**Esta fase no sustituye el parser completo**: separa su sintaxis extendida del motor de negocio, manteniendo el código clásico como respaldo de equivalencia. Por ahora supone una comparación sintáctica adicional por código; no se considera una optimización de latencia.

## Dónde verlo

1. Abre **Scouting → Scoutar**.
2. En **Scouting Speed Pro**, busca **«Subzonas, conos y modificadores TypeScript»**.
3. Si aparece **«Extensiones nativas (respaldo)»**, el sistema sigue aceptando códigos mediante el lector anterior.

## Instalación

| ZIP | Uso |
| --- | --- |
| `Volley_Coach_V20.5.38_SOLO_CAMBIOS.zip` | Recomendado sobre **V20.5.37**. Descomprime y coloca su contenido en la raíz de GitHub, respetando rutas. |
| `Volley_Coach_V20.5.38_COMPLETO.zip` | Proyecto íntegro si necesitas reconstruir el repositorio. |
| `Volley_Coach_V20.5.38_PUBLICACION_VITE.zip` | Artefactos compilados para publicación directa desde Vite. |

Publica el contenido de los ZIP, **no los ZIP como un fichero de la web**. Después de actualizar, recarga forzosamente para renovar el Service Worker.

## Validación manual recomendada

- En un partido de prueba, registra `12A#.4B>5D`, `12A#.4B>C5`, `7E+::31~Q|F%RAP?S1$X` y una recepción `R7R+.6A`, con dorsales que existan en las plantillas.
- Comprueba que las zonas, el cono, los códigos avanzados y la información de jugador mantienen los mismos valores.
- Confirma que **una pulsación registra una única acción**; revisa puntos, deshacer, estadísticas y enlace de vídeo.
- Repite sin conexión y verifica la sincronización entre dos dispositivos de prueba.
- En **Gestión → Comprobación del sistema**, verifica que no falta ningún archivo publicado.

Las pruebas automáticas y de compatibilidad se han ejecutado localmente. No se consideran una validación de nube real ni sustituyen el ensayo en competición. La prueba opcional con Chromium puede quedar bloqueada por restricciones del entorno de ejecución; si sucede, se informará explícitamente.
