# Volley Coach · V20.5.7 · Auditoría de acciones registradas

## Para qué sirve

V20.5.6 compara los **borradores** de la barra de código con el parser nativo. V20.5.7 añade una inspección separada de las **acciones ya presentes en el scouting local**, sin editar el partido y sin ejecutar de nuevo el parser nativo.

La auditoría revisa:

1. **Códigos registrados**: equipo, dorsal, fundamento y evaluación que figuran en el código frente a los campos de la acción almacenada.
2. **Trazas de marcador**: ganador y cambio de puntos explícitos al cerrar cada rally.
3. **Continuidad de tanteo**: marcador final de un rally frente al inicial del siguiente en el mismo set.
4. **Proyección básica de rotación**: cambio de saque y rotación entre dos rallies consecutivos solo si constan todos los datos necesarios.

La comparación se integra en el **mismo módulo ES6 compilado con Vite y TypeScript** que las fases anteriores. No añade otra ruta de escritura, cronómetro ni listener que vuelva a analizar la temporada en cada pulsación.

## Dónde encontrarla

1. Abre tu web después de publicar esta versión y entra en **Gestión**.
2. Debajo de «Comparación de códigos · sesión actual» de V20.5.6 aparecerá **«Auditoría del scouting registrado» (V20.5.7)**.
3. Abre un scouting de prueba en el que hayas registrado acciones y vuelve a Gestión.
4. Pulsa **«Comprobar partido»** para efectuar la lectura. **No se realiza automáticamente durante el registro en directo.**
5. Consulta los contadores y las incidencias con ubicación orientativa: set, número de rally y orden de acción. Puedes descargar el **informe JSON** desde el botón.

Si el partido cambia tras la revisión, Gestión indicará que el informe **ha quedado desactualizado** y desactivará su descarga hasta que pulses de nuevo «Comprobar partido».

## Interpretación de los resultados

| Indicador | Qué significa |
| --- | --- |
| **Coincidencias** | El código y los cuatro campos básicos almacenados son coherentes. |
| **Diferencias** | El código y alguno de los campos básicos almacenados no coinciden. Es un caso para revisar. |
| **Cobertura pendiente** | El inspector TypeScript aún no entiende esa sintaxis; no implica que el motor histórico la rechace. |
| **Sin verificar** | Hay campos incompletos o insuficientes para comparar con seguridad. |
| **Sin código** | Existe una acción registrada sin su código textual. No se considera automáticamente un fallo. |
| **Marcadores inconsistentes** | Ganador y diferencia de puntos explícitos no concuerdan. |
| **Continuidad de tanteo** | El marcador de dos rallies consecutivos no encaja, si ambos están disponibles. |
| **Rotaciones a revisar** | La siguiente rotación o servicio difiere de una proyección básica; una corrección de alineación u otras circunstancias podrían explicarlo. |

**Importante:** los datos sin marcadores o rotaciones explícitas se clasifican como *desconocidos*, no como errores. La auditoría no sustituye la legalidad reglamentaria de cambios, líberos ni alineaciones. Tampoco demuestra que los datos se hayan guardado en IndexedDB o recibido en Supabase o un segundo dispositivo.

La herramienta comprueba **como máximo 20.000 rallies y 60.000 acciones por ejecución**. Si se alcanza uno de esos límites, el informe se marca como *parcial* y no debe interpretarse como un chequeo completo.

## Privacidad y rendimiento

- El resultado se calcula cuando el usuario pulsa el botón, nunca en cada tecla durante un punto.
- Los eventos de `MatchState` y el evento DOM original **solo invalidan** un informe antiguo, sin volver a explorar el partido.
- La información del JSON contiene cantidades agregadas y hasta 80 incidencias genéricas. **No incluye código original, dorsal, jugador, rival, identificador de partido, vídeo ni información de sincronización.**
- El resultado permanece únicamente en memoria; se descarta al actualizar la página o cerrar el módulo.
- No se modifica la puntuación, el orden de saque, el deshacer, los rallies, los archivos de vídeo ni el protocolo de sincronización.

## Archivos incluidos en SOLO CAMBIOS

| Archivo | Cambio |
| --- | --- |
| `src/domain/committed-audit.ts` | Nuevas funciones puras para auditar acciones, puntuación, tanteo y rotaciones. |
| `src/domain/committed-runtime.ts` | Panel de Gestión, invalidación pasiva e informe JSON. |
| `src/vc2055-entry.ts` | Arranque/exportación de los nuevos módulos. |
| `vc2055-domain-core.mjs` | **Módulo ya compilado** para GitHub Pages. |
| `vc2055-domain.css` | Estilos del panel de Gestión. |
| `index.html`, `service-worker.js` | Nueva revisión de recursos y caché. |
| `package.json`, `package-lock.json` | Versión 20.5.7 y pruebas automatizadas. |
| `vc2055-domain.test.cjs`, `vc2056-shadow-validation.test.cjs`, `vc2057-committed-audit.test.cjs` | Pruebas de regresión y del nuevo módulo. |
| `README.md`, `GUIA_V20.5.7_AUDITORIA_REGISTROS.md` | Documentación e instalación. |

## Subir a GitHub

Esta versión se instala **sobre V20.5.6**.

1. Descarga y descomprime `Volley_Coach_V20.5.7_SOLO_CAMBIOS.zip`.
2. Abre el repositorio [marcgnunez-collab/volley-coach](https://github.com/marcgnunez-collab/volley-coach).
3. Sube todos los archivos que contiene el ZIP a la **raíz del repositorio**, conservando las carpetas `src/` y `src/domain/`.
4. Sustituye solo los archivos existentes del mismo nombre. **No borres los archivos históricos** ni subas `node_modules` o `dist` como parte del cambio incremental.
5. Es imprescindible publicar **`vc2055-domain-core.mjs`**. Aunque las fuentes estén en `.ts`, GitHub Pages utiliza el archivo `.mjs` compilado.

`COMPLETO` incluye todo el código fuente. `PUBLICACION_VITE` es una compilación de producción **separada** para probar otra estrategia de despliegue; no debe mezclarse con `SOLO CAMBIOS` en el mismo directorio activo.

## Verificación en desarrollo

```bash
npm ci
npm run typecheck
npm run build
npm run test:foundation
```

También se mantienen las pruebas históricas de sincronización, CAS, diario local, recuperación y formatos de intercambio.

**Pendiente de prueba manual:** un partido de ensayo real, deshacer varias veces, cambiar entre scoutings, vídeo en directo y sincronización PC/móvil con la misma cuenta. Las pruebas automatizadas no demuestran recepción remota ni comportamiento de hardware real.

## Siguiente paso estructural

V20.5.8: ampliar de forma controlada la cobertura de la gramática de scouting sobre ejemplos nativos y anónimos. La sustitución del parser original no se autorizará hasta alcanzar equivalencia comprobable. Después, V20.5.9 abordará la reducción progresiva de scripts históricos y el estado centralizado observable.
