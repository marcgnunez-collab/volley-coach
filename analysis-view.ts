/* V20.5.29 · Pure, typed Data Engine presentation moved out of the historic script.
 * The legacy view remains an exact fallback. This module never touches the DOM,
 * match state, storage, video, subscriptions or the scoring writer.
 */
import type {NormalizedAnalysis} from './analysis-normalizer';
import type {FilteredAnalysis,CoverageSummary,EvaluationSummary,
 PointsReconciliation} from './analysis-operations';

export interface DataEngineViewInput{
 readonly data:NormalizedAnalysis;
 readonly selection:FilteredAnalysis;
 readonly coverage:CoverageSummary;
 readonly attack:EvaluationSummary;
 readonly comparison:PointsReconciliation|null;
}
export interface DataEngineView{
 readonly left:string;readonly center:string;readonly notice:string;
 readonly badges:ReadonlyArray<readonly [string,number]>;
}

// Exactly the historic escaping contract: trim, then encode for HTML text nodes.
const text=(value:unknown)=>String(value??'').trim();
const esc=(value:unknown)=>text(value).replace(/[&<>"']/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[char]!);

/** Produces the same markup and metrics as V19.3.8 panelHTML. */
export function renderDataEngineView(input:DataEngineViewInput):DataEngineView{
 const {data,selection,coverage:c,attack:stats,comparison}=input;
 const rows=c.bySkill.map(row=>`<tr><td><b>${esc(row.skill)}</b></td><td>${row.n}</td><td>${row.properties.team}/${row.n}</td><td>${row.properties.player}/${row.n}</td><td>${row.properties.evaluation}/${row.n}</td><td>${row.properties.zone}/${row.n}</td><td>${row.properties.video}/${row.n}</td></tr>`).join('');
 const chains=selection.chains.slice(-45).reverse().map(link=>`<tr><td>${esc(link.setter.set)} · ${esc(link.setter.rallyIndex)}</td><td>${esc(link.setter.player||'—')}</td><td>${esc(link.reception?.evaluation||'—')}</td><td>${esc(link.target?.code||'—')}</td><td>${esc(link.tempo||'—')}</td><td>${esc(link.attack?.player||'Sin ataque')}</td><td>${esc(link.attack?.evaluation||'—')}</td></tr>`).join('');
 return {left:`<div class="vc1938-audit"><h3>Professional Data Engine · Contactos</h3><p>Modelo común de solo lectura. Los contactos sin equipo o valoración se mantienen como desconocidos, sin asignaciones automáticas.</p><div class="vc1938-filters"><label>Fundamento<select data-vc1938-filter="skill"><option value="">Todos</option>${['S','R','E','A','B','D','F','C'].map(s=>`<option value="${s}">${s}</option>`).join('')}</select></label><label>Valoración<select data-vc1938-filter="evaluation"><option value="">Todas</option>${['#','+','!','-','/','='].map(s=>`<option>${esc(s)}</option>`).join('')}</select></label><button type="button" data-vc1938-export>Exportar selección CSV</button></div><div class="vc1938-metrics"><span><strong>${selection.rallies.length}</strong>rallies filtrados</span><span><strong>${selection.contacts.length}</strong>contactos filtrados</span><span><strong>${selection.possessions.length}</strong>posesiones</span><span><strong>${selection.chains.length}</strong>colocaciones</span></div><div class="vc1938-scroll"><table><thead><tr><th>Fund.</th><th>Total</th><th>Equipo</th><th>Jugador</th><th>Eval.</th><th>Zona</th><th>Vídeo</th></tr></thead><tbody>${rows}</tbody></table></div><small>Los denominadores de cobertura son los contactos de cada fundamento en todo el scouting, antes de filtros.</small></div>`,
  center:`<div class="vc1938-audit"><h3>Posesión → colocación → ataque</h3><p>Solo se emparejan contactos consecutivos del mismo equipo; un contacto rival o sin equipo separa posesiones.</p><div class="vc1938-scroll"><table><thead><tr><th>Set / rally</th><th>Colocador</th><th>Recep.</th><th>Destino</th><th>Tempo</th><th>Atacante</th><th>Eval. A</th></tr></thead><tbody>${chains||'<tr><td colspan="7">No hay colocaciones en esta selección.</td></tr>'}</tbody></table></div><div class="vc1938-note">Ataques evaluados: ${stats.rated}/${stats.recorded}; EFF ataque: ${stats.efficiency==null?'sin muestra':stats.efficiency+' %'}. ${comparison?(comparison.agrees?'K1/K2 coincide en número de oportunidades.':'Revisar diferencias de denominadores K1/K2 con el motor anterior.'):'Sin comparación disponible.'}</div></div>`,
  notice:`${data.count.rallies} rallies totales · ${data.count.closed} cerrados · ${c.unknownTeams} contactos sin equipo · ${c.missingIDs} contactos sin ID · ${c.invalidValues} incidencias de integridad · ${data.issues.length} observaciones`,
  badges:[['Rallies',data.count.rallies],['Contactos',data.count.contacts],['Posesiones',data.count.possessions],['Colocaciones',data.count.chains],['Rallies abiertos',data.count.rallies-data.count.closed]]};
}
