# Volley Coach V20.5.10 · Estadísticas LIVE observables

## ¿Qué cambia?

En **Scouting → Scoutar → Estadísticas LIVE** aparece un resumen compacto que convive con las estadísticas anteriores. Lee exclusivamente el partido seleccionado mediante el estado observable introducido en V20.5.9.

| Indicador | Cálculo | Fuente |
| --- | --- | --- |
| Side-Out propio | Rallies ganados recibiendo / rallies cerrados con saque rival y ganador conocido | Solo rallies cerrados del set actual |
| Break Point propio | Rallies ganados sacando / rallies cerrados con saque propio y ganador conocido | Solo rallies cerrados del set actual |
| Recepción positiva | Recepciones propias `#` o `+` / recepciones propias valoradas | Acciones confirmadas + vista previa señalada del rally abierto |
| Eficiencia de ataque | (`A#` − `A=` − `A/`) / ataques propios valorados | Acciones confirmadas + vista previa señalada del rally abierto |

El símbolo **—** indica que no hay intentos suficientes para un porcentaje. No se fabrican resultados. La presentación distingue las acciones del rally **sin cerrar** de las confirmadas y mantiene los indicadores SO/BP exclusivamente confirmados.

## Arquitectura

- `src/state/live-statistics.ts` contiene los cálculos TypeScript independientes del DOM. No escribe en el partido ni en la nube.
- `src/state/live-statistics-runtime.ts` monta el resumen en el panel original y se suscribe al tema `change` del estado observable. No crea una segunda suscripción al motor nativo ni sustituye `v900-intel`.
- Solo se vuelve a calcular cuando el área de Scouting está visible. Las notificaciones duplicadas del mismo ciclo se agrupan.
- El escaneo de un set se limita a **3.000 rallies y 25.000 acciones confirmadas**. Si se alcanza un límite, la interfaz indica **CÁLCULO PARCIAL**.
- No se ha modificado el motor de puntos, el deshacer, el editor de rallies, la pista, el vídeo, el diario IndexedDB ni el escritor CAS/Supabase.

## Instalación

### Para actualizar el GitHub existente

1. Descarga **`Volley_Coach_V20.5.10_SOLO_CAMBIOS.zip`**.
2. Descomprímelo y copia sus archivos en la raíz de tu repositorio [volley-coach](https://github.com/marcgnunez-collab/volley-coach), **conservando las subcarpetas**.
3. Sustituye los archivos existentes por los de la actualización. **No elimines** otros módulos ni archivos de datos.
4. Publica los cambios normalmente. La página debe cargar `vc2055-domain-core.mjs?v=20.5.10` y `vc2055-domain.css?v=20.5.10`.
5. Cuando se active el nuevo service worker, recarga la aplicación y comprueba Scouting → Scoutar.

La descarga de cambios incluye el `.mjs` generado, por lo que la web estática puede funcionar sin ejecutar Vite en GitHub.

### Alternativas

- **`Volley_Coach_V20.5.10_COMPLETO.zip`:** proyecto fuente completo actualizado, sin `node_modules` ni carpetas de compilación temporal.
- **`Volley_Coach_V20.5.10_PUBLICACION_VITE.zip`:** contenido de `dist/` listo para un despliegue estático independiente. No debe mezclarse con los archivos fuente.

## Pruebas

```bash
npm ci
npm run test:foundation
node --test test-audit/v2012-multi-device-validation.test.cjs test-audit/v2001-sync-engine-reliability.test.cjs test-audit/v2011-durable-sync-journal.test.cjs test-audit/v19320-compatibility-final-audit.test.cjs
node vc2052-architecture-audit.cjs
```

**Resultado:** 67 pruebas de base aprobadas, más 39 pruebas históricas de sincronización y compatibilidad. La inspección estática no encuentra referencias ausentes ni scripts duplicados.

**Limitación de validación:** no fue posible lanzar Chromium en el entorno de desarrollo por una restricción del sistema. La compilación y las pruebas de interfaz simulada se completaron, pero falta una revisión visual y funcional en el navegador del usuario, especialmente con el vídeo y el scouting en directo.

## Prueba manual recomendada

1. Abre un **partido de prueba** y entra en **Scouting → Scoutar**.
2. Comprueba que el nuevo resumen aparece en el panel derecho, encima de la tabla de estadísticas anterior.
3. Registra una recepción positiva y un ataque sin cerrar el rally; deben reflejarse como **provisionales**.
4. Cierra el rally asignando el punto; revisa que desaparezca la nota provisional y que cambien los porcentajes confirmados.
5. Ejecuta **Deshacer**, corrige una acción anterior y cambia de set. El resumen debe recalcularse sin modificar el tanteo ni el editor.
6. Repite desde móvil y con red interrumpida; comprueba que el scouting y las estadísticas mantienen su comportamiento y que la sincronización entre dispositivos sigue operativa.

## Siguiente migración

La estructura todavía incluye los grandes archivos históricos. El siguiente objetivo es unificar un panel de estadísticas completo por equipo y rotación, reutilizando los cálculos comprobados y conservando una única fuente de datos confirmados.
