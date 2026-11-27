# Volley Coach V20.7.12 · Vistas de análisis fuera del núcleo

## Qué se ha migrado

Se extraen **11 funciones de presentación HTML** del núcleo
`021-core-scouting-v150-monolithic.js` al módulo de vistas e informes ya
existente `011-v5115-pdf-rosters-script.js`:

- **V6.4 — Tendencias:** tarjetas del colocador y del atacante.
- **V6.5 — Análisis de rivales:** tabla de partidos, distribución del
  colocador, direcciones de ataque y rotaciones.
- **V6.7 — Cruces tácticos:** matriz 6×6, conclusiones, cruce seleccionado,
  resumen por rotación y patrones de ataque.

Cada función conserva **exactamente su cuerpo JavaScript original**. En el
núcleo queda un adaptador pequeño que entrega explícitamente las dependencias
de lectura actuales y recibe el HTML. Las escrituras y los eventos siguen
bajo el control del núcleo nativo.

No se añade ningún script ni solicitud de red. El HTML sigue cargando el
módulo `011` antes del núcleo `021`; el Service Worker y las versiones de
URL actualizadas evitan mezclar código antiguo con el nuevo.

## Resultado medido frente a V20.7.11

| Recurso | Diferencia sin comprimir | Diferencia gzip (nivel 9) |
| --- | ---: | ---: |
| Núcleo `021` | **−20.816 bytes** | **−3.757 bytes** |
| Vistas e informes `011` | +25.770 bytes | +5.292 bytes |
| `index.html` (aviso y referencias) | +575 bytes | +174 bytes |
| **Total de estos tres recursos** | **+5.529 bytes** | **+1.709 bytes** |

Esta fase aporta **separación de responsabilidades y un núcleo más pequeño**,
pero todavía **no reduce el tamaño comprimido global**. Más adelante se
podrán empaquetar/minificar las vistas para buscar el ahorro de transferencia
sin perder las garantías de paridad.

## Verificación y seguridad

- Las 11 declaraciones originales se reconstruyen desde `011` y se
  comparan con hashes SHA-256 fijados desde V20.7.11.
- Se ejecutan las funciones antiguas y nuevas con las mismas dependencias
  de prueba y se compara su HTML. Se comprueba que no alteran las entradas.
- Se verifica el orden de carga y que se mantiene un solo escritor de puntos,
  Deshacer, datos locales, vídeo y sincronización.
- La auditoría de activos y las pruebas existentes deben continuar pasando.
- **No se ha comprobado aquí la interfaz publicada en un navegador real**.
  Tras subirlo, revisa vistas de Tendencias, Rival, Rotaciones 6×6, botón
  para ocultar/mostrar la barra lateral, Punto/Deshacer y la sincronización
  de dos dispositivos.

## Actualización incremental en GitHub

1. **Base necesaria:** V20.7.11 ya aplicada.
2. Descarga y descomprime `Volley_Coach_V20.7.12_SOLO_CAMBIOS.zip`.
3. Copia **únicamente** los archivos incluidos a la raíz del repositorio,
   manteniendo sus rutas y sobrescribiendo los nombres repetidos.
4. **No elimines ningún archivo**: los **41 candidatos históricos** siguen
   inventariados y protegidos para la limpieza final.
5. **No subas el ZIP de Vite** por separado si sigues tu procedimiento normal
   de subir `SOLO_CAMBIOS` a GitHub.

## Siguiente etapa de arquitectura

Continuar separando las consultas de Scouting y el renderizado de las
escrituras, reducir dependencias entre componentes, mejorar la compactación
de la distribución y ejecutar pruebas de extremo a extremo en la app
publicada. **No se considera terminada la migración** ni se recomienda
todavía la eliminación masiva de archivos.
