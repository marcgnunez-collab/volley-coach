# Volley Coach V20.5.75 — Registro de scouting coordinado por TypeScript

## Qué cambia realmente

La gran reestructuración avanza desde los cálculos de planificación de V20.5.74
hacia el motor de scouting. En V20.5.75, el recorrido profesional de registrar
un código (`v857RegisterRaw`) ya utiliza, una vez cargado el módulo moderno,
un **coordinador TypeScript** para ejecutar la secuencia:

1. Leer el número de acciones del rally antes de empezar.
2. Interpretar el código mediante **el parser nativo actual**, una sola vez.
3. Si es válido, entregar la acción al **único escritor nativo existente**, una
   sola vez; no se crea un segundo motor que escriba acciones o puntos.
4. Leer el resultado y comprobar que el número de acciones ha aumentado en una.
5. Devolver el mismo contrato de éxito o error y la referencia a la acción real.

La prevalidación de código, equipo, partido y set conserva las reglas y el orden
históricos. La vía clásica permanece disponible si el módulo TypeScript aún no
se ha cargado o falla **antes** de llamar al parser. Si el parser o el escritor
ya han sido invocados, un fallo **nunca provoca un segundo intento**, para
evitar duplicados en scouting, marcador o diario de sincronización.

Archivos nuevos:

- `src/domain/scout-registration-lane.ts`: contrato y coordinación de la acción.
- `src/domain/scout-registration-lane-runtime.ts`: instalación versionada en la
  interfaz clásica, sin DOM ni almacenamiento dentro del coordinador.

Archivo conectado al nuevo módulo:

- `021-core-scouting-v150-monolithic.js`: conserva el escritor y el retorno
  clásicos. El adaptador tipado llama a esa ruta única cuando está disponible.
- `src/vc2055-entry.ts`: instala el coordinador dentro de los módulos Vite.

## Qué no cambia

- **Marcador, puntos, cierre y deshacer rallies**: mantienen sus únicos
  comandos nativos y la protección existente.
- **Scouting manual, teclado rápido, pista y códigos avanzados**: siguen
  llegando al motor de acciones ya existente.
- **Vídeo, REC, Delay, clips, huellas temporales y metadatos Data Volley**:
  conservan las envolturas y campos nativos en el mismo orden.
- **Datos locales, diario IndexedDB, CAS/Supabase y presencia de dispositivos**:
  no se añade ningún escritor ni petición de red.

**Importante:** este paso migra la coordinación del registro, **no** todo el
motor de acciones ni su almacenamiento. El antiguo `scoutPushAction` aún es el
único escritor. Las demás pantallas y los antiguos scripts siguen presentes.

## Pruebas realizadas

- Equivalencia entre ruta clásica y TypeScript para códigos representativos de
  saque, colocación, ataque, rival y extensiones.
- Identidad de la acción real y conservación de vídeo, llamada de colocador y
  metadatos de contacto.
- Código vacío, sin partido, partido finalizado, set cerrado y error de parser.
- Escritura rechazada, ausencia de incremento y cambio parcial de estado.
- Excepciones antes y después de invocar el escritor, sin repetición.
- Intento malicioso de doble registro: el segundo envío queda bloqueado.
- **50 códigos rápidos sucesivos**, con exactamente 50 llamadas al escritor.
- Integración TypeScript/Vite y PWA, además de la batería histórica.

Estas son **pruebas automatizadas con simulación de funciones nativas**. No
certifican una sesión de scouting en vivo con móvil, cámara o Supabase real.

## Comprobación manual recomendada antes de un partido importante

1. Descarga una copia JSON completa de los datos y comprueba que la nube está
   sincronizada. No actualices mientras grabas o durante un partido.
2. Publica la nueva versión. Abre un **partido de prueba**, no uno oficial.
3. Introduce varios códigos rápidos y acciones de pista; verifica su orden en
   el rally y que las estadísticas cambian exactamente una vez.
4. Suma puntos, usa **Deshacer** y vuelve a registrar una acción.
5. Comprueba el reloj del vídeo, REC/Delay, la referencia del clip y la
   corrección de acciones desde vídeo.
6. Verifica por separado la sincronización PC/móvil y el contador de
   dispositivos; no cierres una incidencia si siguen apareciendo pendientes.
7. Solo después utiliza la versión para un partido real.

## Instalación en GitHub

- **SOLO_CAMBIOS:** descomprimir y subir **todos sus archivos a la raíz** del
  repositorio, conservando `src/domain/`, `test-audit/` y las demás carpetas.
  Añadir los archivos nuevos y reemplazar homónimos. **No borrar** módulos
  clásicos, carpetas antiguas, vídeos, estilos ni herramientas de recuperación.
- **COMPLETO:** guardar como copia íntegra del proyecto V20.5.75.
- **PUBLICACION_VITE:** utilizar solo si publicas los archivos compilados en un
  hosting estático; no mezclar con el código fuente de GitHub.

Después de subir los cambios, esperar a GitHub Actions y comprobar una sesión
de prueba antes de trabajar con datos reales.

## Próximo bloque

V20.5.76: ampliar el contrato de comando hacia preparación y registro desde
código rápido/pista, reforzando la invalidación ante cambios de partido y la
comprobación de identidades. Sin convertir todavía IndexedDB en fuente
autoritativa ni retirar scripts necesarios para compatibilidad.
