# Volley Coach V20.7.15 · Vídeo e informes agrupados con carga diferida

## Cambios de arquitectura

Se preservan los **11 scripts originales** dentro de **dos bundles** que ya
existían como recursos activos. No se añade ninguna petición ni archivo de
ejecución nuevo.

### 1. Bundle de vídeo: `162-vc1830-video-workspaces.js`

Incluye ocho módulos originales, ejecutados en su orden anterior:

1. `155` — vídeo unificado.
2. `156` — vídeo de entrenamientos.
3. `157` — grabación de partidos.
4. `158` — diagnóstico de instalación.
5. `159` — evidencia cruzada de vídeo.
6. `160` — disposición del estudio de vídeo.
7. `161` — fiabilidad de vídeo.
8. `162` — espacios de trabajo de vídeo.

### 2. Bundle de informes: `138-vc1655-tactical-video.js`

Incluye tres módulos originales:

1. `140` — informes profesionales.
2. `139` — comparaciones.
3. `138` — vídeo táctico.

Los dos bundles mantienen el atributo **`defer`**. Todos los originales
se ejecutan en funciones autoejecutadas independientes, sin depender del
nombre o la URL del propio script. Se conservan su código exacto,
sus inicializaciones y el orden entre implementaciones.

## Resultados medidos frente a V20.7.14

| Recurso | Gzip original | Gzip nuevo | Ahorro |
| --- | ---: | ---: | ---: |
| Ocho módulos de vídeo | 53.534 B | 45.160 B | **8.374 B** |
| Tres módulos de informes | 19.608 B | 17.895 B | **1.713 B** |
| HTML y etiquetas eliminadas | — | — | **2 B** |
| **Total** | | | **10.089 bytes gzip menos** |

- **9 solicitudes JavaScript activas menos**.
- Dos bundles cargados con `defer`, igual que antes.
- El Service Worker pasa a precargar los bundles necesarios, evitando
  solicitar versiones desplazadas al arrancar offline.
- Los 9 scripts desplazados permanecen intactos e inventariados para
  retirada futura: **59 candidatos en total**, sin eliminaciones.

## Comprobaciones

- Cada segmento del bundle se verifica frente a su SHA-256 original
  y, cuando corresponde, el archivo histórico conservado.
- Se compilan JavaScript y TypeScript, se verifica el orden del HTML
  en fuente y compilación Vite y se comprueba la sintaxis de los IIFE.
- La auditoría detecta referencias huérfanas, rutas rotas y activos
  precargados incorrectamente.
- Los escritores nativos de puntos, Deshacer, IndexedDB, vídeo,
  diario local y Supabase no se modifican.

**No se ha hecho una prueba real de los dos dispositivos o de la app
publicada en navegador**. Antes de retirar archivos habrá que revisar
vídeo Live/Delay, grabación, informes, comparaciones, sincronización
PC/móvil y todo el circuito de Scouting.

## Instalación en GitHub

1. **Base requerida:** V20.7.14 ya subida.
2. Descarga el ZIP **V20.7.15 SOLO_CAMBIOS**.
3. Sube solamente sus archivos, respetando rutas y carpetas,
   sobrescribiendo los repetidos.
4. **No borres ningún archivo antiguo.** Los 59 candidatos están
   inventariados para una futura limpieza única.
5. No subas aparte el ZIP Vite si utilizas tu procedimiento habitual
   de actualizaciones incrementales.

## Próxima fase

Seguiremos buscando consolidaciones que reduzcan peticiones reales
y después validaremos las operaciones críticas en la aplicación
publicada. El objetivo final es cerrar la migración con menos archivos
activos, módulos claros y una lista de eliminación verificada.
