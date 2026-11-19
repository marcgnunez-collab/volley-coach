/* V20.5.37 · Pure lexer for the established scouting grammar.
 * Syntax only: no player lookup, match mutation, point, rally or video handling.
 */

export type ScoutingLexeme=Readonly<{
 kind:'code';
 rival:boolean;
 number:string;
 skill:string;
 evaluation:string;
 startZone:string;
 endZone:string;
 serveType:string;
 combo:string;
 phase:string;
 blockers:string;
}>|Readonly<{kind:'error';error:string}>;

const SCOUT_CODE=/^(R)?(\d+)(S|R|E|A|B|D|F|C)([#\+!\-\/=])?(?:\.([1-9])(?:>([1-9]))?)?(.*)$/;
const SERVE=/~(JF|JP|F|U)/;
const COMBO=/:(Z4|Z2|Z1|Z6|1T|31|BACK|PIPE|2T|OTR)/;
const PHASE=/\^(K1|K2|FB|TR)/;
const BLOCKERS=/@([0-3])/;

/** Scan one classic code, preserving the legacy regex and modifier order.
 * Outer wrappers handle cones, subzones, tempo and tactical extensions.
 */
export function lexScoutingCode(input:unknown):ScoutingLexeme{
 const raw=String(input||'').trim().toUpperCase().replace(/\s+/g,'');
 const mt=raw.match(SCOUT_CODE);
 if(!mt)return {kind:'error',error:'Código no reconocido.'};
 let rest=mt[7]||'';
 const serveType=rest.match(SERVE)?.[1]||'';rest=rest.replace(SERVE,'');
 const combo=rest.match(COMBO)?.[1]||'';rest=rest.replace(COMBO,'');
 const phase=rest.match(PHASE)?.[1]||'';rest=rest.replace(PHASE,'');
 const blockers=rest.match(BLOCKERS)?.[1]||'';rest=rest.replace(BLOCKERS,'');
 if(rest)return {kind:'error',error:'Parte avanzada no reconocida: '+rest};
 return {
  kind:'code',rival:!!mt[1],number:mt[2],skill:mt[3],evaluation:mt[4]||'!',
  startZone:mt[5]||'',endZone:mt[6]||'',serveType,combo,phase,blockers
 };
}
