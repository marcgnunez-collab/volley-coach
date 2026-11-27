# Volley Coach V20.7.8 · Informes Scouting fuera del núcleo principal

## Qué se ha migrado

Dos generadores de HTML para informes de Scouting han pasado del gran núcleo
`021-core-scouting-v150-monolithic.js` al módulo existente
`011-v5115-pdf-rosters-script.js`:

- `v757OfficialHTML`: informe oficial (cuerpo original de 5.944 bytes).
- `v757ProPages`: informe profesional multipágina (19.014 bytes).

El núcleo de Scouting pasa de **729.913 a 705.674 bytes**; se han trasladado
las funciones de presentación, no las de cálculo ni los escritores. El módulo
de PDF conserva **intactos sus 23.184 bytes de código anterior** y añade los
dos generadores bajo una API de sólo lectura.

**No aparece ningún nuevo archivo JavaScript activo ni ninguna nueva
petición de red.** El tamaño combinado sin comprimir aumenta ligeramente
por los adaptadores explícitos. En gzip, las dos fuentes juntas pasan de
192.565 a 193.418 bytes (**853 bytes más**). Este bloque es una mejora de
separación de responsabilidades y mantenimiento, no un ahorro total de
descarga todavía. En fases siguientes podremos optimizar los informes
independientemente del motor del partido.

## Seguridad del cambio

- Los cuerpos originales de ambos generadores están conservados
  **byte por byte**; se comparan sus SHA-256 con los de V20.7.7.
- Las dependencias de cada informe se pasan en el momento de ejecutarlo, por
  lo que se usan el equipo activo y el scouting actuales.
- Se compara el HTML generado por la implementación original y la migrada
  con un partido de ejemplo sin rallies.
- El sistema original de PDF de entrenamientos y convocatorias no se modifica.
- **Punto, deshacer, alineaciones, CSV, REC/Delay, Supabase, IndexedDB y
  sincronización** mantienen sus funciones y rutas originales.

## Subida a GitHub

1. Base necesaria: **V20.7.7**.
2. Descomprime **V20.7.8 SOLO_CAMBIOS** y sube sus archivos a la raíz de
   GitHub, conservando las subcarpetas y sobrescribiendo los nombres repetidos.
3. Este ZIP contiene únicamente los archivos **modificados o añadidos**,
   comprobados uno a uno contra V20.7.7. No debes borrar ninguno.
4. **No subas el ZIP de Vite aparte** si sigues tu proceso habitual.
5. Tras GitHub Actions, revisa en la app el PDF oficial de Scouting, el PDF
   profesional, las tablas de análisis y los PDF de entrenamientos.

## Qué queda

Quedan **37 candidatos antiguos** inventariados para la limpieza final.
Ninguno de los dos archivos modificados en este bloque se puede borrar: ambos
siguen siendo activos.

La migración del monolito no está completa. Los próximos objetivos son separar
otras vistas/consultas sin duplicar escrituras, y después comprobar puntos,
deshacer, nube y dos dispositivos en la aplicación real antes de retirar
cualquier archivo histórico.
