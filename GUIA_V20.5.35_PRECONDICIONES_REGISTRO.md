# Volley Coach V20.5.35 · Precondiciones de registro TypeScript

**Base de actualización: V20.5.34.** Por primera vez, el registrador nativo de códigos (`v857RegisterRaw`) utiliza una decisión de un módulo TypeScript, pero solo para tres condiciones de entrada y **únicamente cuando coincide exactamente con el resultado original**.

## Qué se ha migrado

- Comprobación de código vacío tras el preprocesamiento histórico.
- Comprobación de partido inexistente o finalizado.
- Comprobación de set inexistente o ya cerrado.
- Evaluación previa al registro mediante `inspectRegistrationConditions`, una función pura TypeScript que recibe cinco booleanos, sin objetos de partido, nombres, dorsales ni datos de vídeo.
- Comparación de cada decisión con el resultado nativo. Si no hay TypeScript, discrepa o arroja una excepción, se utiliza el error original.

**No se ha migrado:** el parser de código real, `scoutPushAction`, la escritura del rally, marcador, adjudicación de puntos, rotaciones, deshacer, IndexedDB, CAS/Supabase ni vídeo.

## Dónde se ve

Abre **Scouting → Scoutar → SCOUTING SPEED PRO**. Debajo del título aparece «Precondiciones TypeScript · registro nativo» si el módulo está disponible, o «Precondiciones clásicas · registro nativo» como respaldo.

No se añade ningún botón de registro nuevo: se siguen utilizando los controles originales. Los contadores de comprobación son exclusivamente numéricos y pueden inspeccionarse mediante la API de diagnóstico `VC_SCOUT_REG_GUARD_DIAGNOSTICS_20535()`.

## Cómo instalar

- Con **V20.5.34 ya publicada**: extrae `Volley_Coach_V20.5.35_SOLO_CAMBIOS.zip` y sube el contenido a la raíz de `volley-coach`; reemplaza coincidencias y no borres el resto.
- Para actualizar desde una versión anterior: utiliza el paquete `Volley_Coach_V20.5.35_COMPLETO.zip` con todos los fuentes, o integra secuencialmente los cambios faltantes.
- Para publicar la web compilada: utiliza exclusivamente `Volley_Coach_V20.5.35_PUBLICACION_VITE.zip`, sin mezclarlo con los fuentes.

## Verificaciones recomendadas en un partido de prueba

1. Con un partido activo y set abierto, añade un código conocido (`7A#` con dorsal válido) y confirma que solo se registra una acción.
2. Intenta introducir código vacío; no se debe registrar nada.
3. Repite con scouting finalizado y set cerrado; deben seguir apareciendo los mismos mensajes de siempre.
4. Prueba error de dorsal, corrección, deshacer, vídeo y cambio de saque, comprobando el contador y las rotaciones.
5. Repite en móvil y con otro dispositivo conectado; la migración no constituye todavía una certificación de sincronización real.

La suite de pruebas verifica las 32 combinaciones de condiciones, el recorrido exacto del registrador, el uso de un único parser y escritor, el respaldo clásico y los errores posteriores a la comprobación. La sustitución del motor de puntuación solo se abordará tras más pruebas y migración de sus contratos.
