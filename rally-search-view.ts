/* V20.5.30 · Read-only Rally Search HTML presentation in real TypeScript/Vite.
 * Presets, CSV, video jumps and native handlers remain in the legacy adapter.
 * No DOM, storage, match writes or I/O.
 */
import type {NormalizedAnalysis} from './analysis-normalizer';
import type {SearchResult} from './analysis-query';

const val=(x:unknown)=>String(x??'').trim();
const esc=(x:unknown)=>val(x).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]!);
const option=(x:string,label=x)=>`<option value="${esc(x)}">${esc(label)}</option>`;
const skillLabels:Readonly<Record<string,string>>={S:'Saque',R:'Recepción',E:'Colocación',
 A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Control'};
const selectors={
 skill:[['','Todos los fundamentos'],...Object.entries(skillLabels)],
 evaluation:[['','Todas las valoraciones'],...['#','+','!','-','/','='].map(x=>[x,x])],
 ownRotation:[['','Todas'],...[1,2,3,4,5,6].map(x=>[String(x),'R'+x])],
 rivalRotation:[['','Todas'],...[1,2,3,4,5,6].map(x=>[String(x),'R'+x])],
 reception:[['','Cualquier recepción'],...['#','+','!','-','/','='].map(x=>[x,x])],
 outcome:[['','Todos'],['ours','Punto nuestro'],['opponent','Punto rival']],
 video:[['','Todos'],['yes','Con marca de vídeo'],['no','Sin marca de vídeo']],
 status:[['closed','Solo cerrados'],['all','Cerrados y abiertos'],['open','Solo abiertos']]
};

export interface RallySearchCatalog{
 readonly players:readonly string[];readonly setters:readonly string[];
 readonly attackers:readonly string[];readonly tempos:readonly string[];
 readonly combos:readonly string[];readonly startZones:readonly string[];
 readonly endZones:readonly string[];
}
export interface RallySearchView{readonly left:string;readonly center:string;}

export function catalogRallySearch(data:NormalizedAnalysis):RallySearchCatalog{
 const unique=(values:readonly unknown[])=>[...new Set(values.map(val).filter(Boolean))]
  .sort((a,b)=>a.localeCompare(b,'es',{numeric:true})).slice(0,250);
 const contacts=Array.isArray(data?.contacts)?data.contacts:[],
  chains=Array.isArray(data?.chains)?data.chains:[];
 return {players:unique(contacts.map(x=>x.player)),setters:unique(chains.map(x=>x.setter?.player)),
  attackers:unique(chains.map(x=>x.attack?.player)),
  tempos:unique(chains.map(x=>x.tempo||x.attack?.fields?.attackTempo)),
  combos:unique(chains.map(x=>x.combo)),
  startZones:unique(contacts.map(x=>x.fields?.startZone?.code)),
  endZones:unique(contacts.map(x=>x.fields?.endZone?.code))};
}

const field=(label:string,id:string,items:readonly (readonly string[])[])=>
 `<label>${esc(label)}<select data-vc1939-filter="${id}">${items.map(([k,v])=>option(k,v)).join('')}</select></label>`;

/** Literal-markup parity with V19.3.9 renderPanel (legacy stays available). */
export function renderRallySearchView(data:NormalizedAnalysis,result:SearchResult,
 _filters:Readonly<Record<string,unknown>>={}):RallySearchView{
 const c=catalogRallySearch(data),
  selectOptions=(choices:readonly string[])=>[['','Todos'],...choices.map(x=>[x,x])];
 const filterBlock=`<div class="vc1939-search" aria-label="Buscar rallies con filtros cruzados"><div class="vc1939-intro"><strong>RALLY SEARCH PRO</strong><small>Todos los criterios se combinan · un contacto no hereda la valoración de otro</small></div>
  <div class="vc1939-grid vc1939-basic"><label>Código / texto<input data-vc1939-filter="code" maxlength="100" placeholder="Ej.: A4#, Z4 o código de scouting"></label>
  ${field('Fundamento','skill',selectors.skill)}${field('Jugador','player',selectOptions(c.players))}${field('Valoración','evaluation',selectors.evaluation)}</div>
  <details class="vc1939-advanced"><summary>Más criterios · rotaciones, colocador y secuencias</summary><div class="vc1939-grid">
  ${field('Rotación propia','ownRotation',selectors.ownRotation)}${field('Rotación rival','rivalRotation',selectors.rivalRotation)}
  ${field('Recepción anterior','reception',selectors.reception)}${field('Colocador','setter',selectOptions(c.setters))}
  ${field('Atacante tras colocación','attacker',selectOptions(c.attackers))}${field('Tempo','tempo',selectOptions(c.tempos))}
  ${field('Combinación','combo',selectOptions(c.combos))}${field('Origen','startZone',selectOptions(c.startZones))}
  ${field('Destino','endZone',selectOptions(c.endZones))}${field('Ganador del rally','outcome',selectors.outcome)}
  ${field('Marca temporal','video',selectors.video)}${field('Estado del rally','status',selectors.status)}</div></details>
  <div class="vc1939-actions"><button type="button" data-vc1939-clear>Limpiar búsqueda</button><button type="button" data-vc1939-export>Exportar CSV</button></div>
  <div class="vc1939-presets"><select data-vc1939-preset aria-label="Búsquedas guardadas"><option value="">Búsquedas guardadas</option></select><button type="button" data-vc1939-save>Guardar</button><button type="button" data-vc1939-load>Aplicar</button><button type="button" data-vc1939-delete>Eliminar</button></div>
  <p class="vc1939-context-note">Se aplican también los filtros superiores de scouting, equipo, set, rotación y K1/K2. Para búsquedas por secuencia, colocador, recepción y ataque deben pertenecer a una misma posesión.</p></div>`;
 const summary=result.statistics,stats=`<div class="vc1939-metrics"><div><strong>${summary.rallies}</strong><span>Rallies</span></div><div><strong>${summary.contacts}</strong><span>Contactos</span></div><div><strong>${summary.chains}</strong><span>Colocaciones</span></div><div><strong>${summary.videoContacts}</strong><span>Marcas vídeo</span></div></div>`;
 const skills=summary.bySkill.map(([key,n])=>`<tr><td>${esc(skillLabels[key]||key)}</td><td>${n}</td><td>${summary.contacts?Math.round(n/summary.contacts*1000)/10:0} %</td></tr>`).join('');
 const players=summary.byPlayer.slice(0,10).map(([key,n])=>`<tr><td>${esc(key)}</td><td>${n}</td></tr>`).join('');
 const left=`<div class="vc1939-left"><h3>Buscador de rallies</h3>${filterBlock}${stats}<div class="vc1939-scroll"><table><thead><tr><th>Fundamento</th><th>Contactos</th><th>Uso</th></tr></thead><tbody>${skills||'<tr><td colspan="3">Sin acciones con esta selección.</td></tr>'}</tbody></table></div></div>`;
 const seqRows=result.chains.slice(0,50).map(c=>`<tr><td>S${c.setter?.set} · R${c.setter?.rallyIndex}</td><td>${esc(c.reception?.evaluation||'—')}</td><td>${esc(c.setter?.player||'—')}</td><td>${esc(c.tempo||'—')}</td><td>${esc(c.attack?.player||'—')}</td><td>${esc(c.attack?.evaluation||'—')}</td></tr>`).join('');
 const center=`<div class="vc1939-center-body"><h3>Resultados y secuencias</h3><p class="vc1939-summary">Ataques valorados: ${summary.attackRated} · Eficiencia: ${summary.efficiency==null?'Sin muestra':summary.efficiency.toLocaleString('es-ES')+' %'} · Sin valoración: ${summary.missingEvaluation} contactos.</p><div class="vc1939-scroll"><table><thead><tr><th>Jugador</th><th>Acciones</th></tr></thead><tbody>${players||'<tr><td colspan="2">Sin jugadores codificados.</td></tr>'}</tbody></table></div><h4>Recepción → Colocación → Ataque</h4><div class="vc1939-scroll"><table><thead><tr><th>Set/rally</th><th>Recep.</th><th>Colocador</th><th>Tempo</th><th>Atacante</th><th>Eval. A</th></tr></thead><tbody>${seqRows||'<tr><td colspan="6">No hay secuencias completas con estos filtros.</td></tr>'}</tbody></table></div></div>`;
 // Filter values are assigned by the historic DOM adapter, not embedded in the
 // template; this preserves the live cursor and the saved-search behavior.
 return {left,center};
}
