/* V20.5.23 · Compatibility bridge and opt-in, read-only query timings in Gestión.
 * Does not observe or write the match, cloud, IndexedDB or scouting editor.
 */
import {queryRallies,type SearchData,type SearchFilters,type SearchResult} from './analysis-query';
import type {AnalysisNormalizeWindow} from './analysis-normalize-runtime';
import type {AnalysisOperationsWindow} from './analysis-operations-runtime';
import type {AnalysisExportWindow} from './analysis-export-runtime';

export interface AnalysisQueryDiagnostics{
 readonly readOnly:true;
 readonly queries:number;
 readonly failures:number;
 readonly slowQueries:number;
 readonly lastMs:number;
 readonly averageMs:number;
 readonly maxMs:number;
 readonly budgetMs:16;
}
export interface AnalysisQueryBridge{
 readonly VERSION:'20.5.23';
 readonly readOnly:true;
 query:(data:SearchData|null|undefined,filters?:SearchFilters)=>SearchResult;
 diagnostics:()=>Readonly<AnalysisQueryDiagnostics>;
}
type AnalysisQueryWindow=Window&AnalysisNormalizeWindow&AnalysisOperationsWindow&AnalysisExportWindow&{
 VC_ANALYSIS_QUERY_20523?:Readonly<AnalysisQueryBridge>;
};
export interface QueryPerformancePanel{
 readonly readOnly:true;
 readonly refresh:()=>void;
 readonly dispose:()=>void;
}
const bridges=new WeakMap<Window,Readonly<AnalysisQueryBridge>>();
const panels=new WeakMap<Window,Readonly<QueryPerformancePanel>>();

/** Install before page initialization so the historic UI can delegate on first use. */
export function installAnalysisQueryBridge(win:AnalysisQueryWindow):Readonly<AnalysisQueryBridge>{
 const existing=bridges.get(win);if(existing)return existing;
 let queries=0,failures=0,slowQueries=0,lastMs=0,averageMs=0,maxMs=0;
 const clock=()=>{
  try{const n=win.performance?.now?.();return Number.isFinite(n)?n!:Date.now();}
  catch(_){return Date.now();}
 };
 const api:Readonly<AnalysisQueryBridge>=Object.freeze({
  VERSION:'20.5.23',readOnly:true,
  query(data:SearchData|null|undefined,filters:SearchFilters={}){
   const start=clock();
   try{return queryRallies(data,filters);}
   catch(error){failures++;throw error;}
   finally{
    const elapsed=clock()-start;
    lastMs=Number.isFinite(elapsed)&&elapsed>=0?Math.round(elapsed*100)/100:0;
    queries++;averageMs+=((lastMs-averageMs)/queries);
    maxMs=Math.max(maxMs,lastMs);if(lastMs>16)slowQueries++;
   }
  },
  diagnostics:()=>Object.freeze({readOnly:true as const,queries,failures,slowQueries,
   lastMs,averageMs:Math.round(averageMs*100)/100,maxMs,budgetMs:16 as const})
 });
 bridges.set(win,api);win.VC_ANALYSIS_QUERY_20523=api;return api;
}

/** Manual-only metrics: no polling, player names, codes, match IDs or native listeners. */
export function mountAnalysisQueryPerformance(win:AnalysisQueryWindow):Readonly<QueryPerformancePanel>|null{
 const old=panels.get(win);if(old)return old;
 const doc=win.document,host=doc.getElementById('v11-management');if(!host)return null;
 const performance=doc.getElementById('vc60-diagnostics'),container=performance||host;
 const engine=win.VC_ANALYSIS_QUERY_20523||installAnalysisQueryBridge(win);
 const node=(tag:string,klass='',value='')=>{
  const el=doc.createElement(tag);el.className=klass;el.textContent=value;return el;
 };
 const section=node('section','vc20523-query-metrics');section.id='vc20523-query-metrics';
 const heading=node('div','vc20523-heading'),title=node('div');
 title.append(node('small','','V20.5.26 · ANÁLISIS'),node('h3','','Rendimiento del Data Engine y búsquedas'));
 heading.append(title,node('span','','Solo lectura'));
 const description=node('p','',
  'Mediciones locales de normalización, filtros, índices, exportación CSV y búsqueda táctica. No incluyen vídeo, descarga, renderizado ni sincronización.');
 const metrics=node('div','vc20523-values'),values=new Map<string,HTMLElement>();
 for(const [key,label] of [['queries','Consultas'],['last','Última'],['average','Media'],
  ['max','Máxima'],['slow','Más de 16 ms'],['failures','Errores']]){
  const box=node('div');box.append(node('small','',label));
  const value=node('strong','','—');box.append(value);metrics.append(box);values.set(key,value);
 }
 const normalizeHeading=node('h4','vc20524-subheading','Normalización del Data Engine');
 const normalizationMetrics=node('div','vc20523-values'),normalizedValues=new Map<string,HTMLElement>();
 for(const [key,label] of [['normalizations','Normalizaciones'],['last','Última'],['average','Media'],
  ['max','Máxima'],['slow','Más de 16 ms'],['failures','Errores']]){
  const box=node('div');box.append(node('small','',label));
  const value=node('strong','','—');box.append(value);normalizationMetrics.append(box);normalizedValues.set(key,value);
 }
 const operationHeading=node('h4','vc20524-subheading','Filtros, métricas, K1/K2 y cobertura');
 const operationMetrics=node('div','vc20523-values'),operationValues=new Map<string,HTMLElement>();
 for(const [key,label] of [['operations','Operaciones'],['filters','Filtros'],
  ['evaluations','Evaluaciones'],['points','K1/K2'],['coverage','Cobertura'],
  ['reconciliations','Conciliaciones'],['average','Media'],['slow','Más de 16 ms'],['failures','Errores']]){
  const box=node('div');box.append(node('small','',label));
  const value=node('strong','','—');box.append(value);operationMetrics.append(box);
  operationValues.set(key,value);
 }
 const exportHeading=node('h4','vc20524-subheading','Exportación CSV e índices temporales');
 const exportMetrics=node('div','vc20523-values'),exportValues=new Map<string,HTMLElement>();
 for(const [key,label] of [['exports','CSV generados'],['last','Último CSV'],
  ['average','Media CSV'],['failures','Errores CSV'],['builds','Índices creados'],
  ['hits','Índices reutilizados'],['invalidations','Índices invalidados'],
  ['unsupported','Datos no indexables']]){
  const box=node('div');box.append(node('small','',label));
  const value=node('strong','','—');box.append(value);exportMetrics.append(box);
  exportValues.set(key,value);
 }
 const refreshButton=node('button','vc20523-refresh','Actualizar medición') as HTMLButtonElement;
 refreshButton.type='button';
 const note=node('p','vc20523-note',
  'El umbral de 16 ms es orientativo: no garantiza respuesta en tiempo real. No se guardan códigos, nombres, partidos ni resultados en este diagnóstico.');
 section.append(heading,description,node('h4','vc20524-subheading','Búsqueda táctica'),metrics,
  normalizeHeading,normalizationMetrics,operationHeading,operationMetrics,
  exportHeading,exportMetrics,refreshButton,note);
 const anchor=doc.getElementById(performance?'vc60-stat-grid':'vc2059-observable');
 if(anchor?.parentNode===container)anchor.insertAdjacentElement('afterend',section);
 else container.append(section);
 let disposed=false;
 const ms=(value:number)=>`${value.toFixed(2)} ms`;
 const refresh=()=>{
  if(disposed)return;
  const d=engine.diagnostics();
  const data={queries:String(d.queries),last:ms(d.lastMs),average:ms(d.averageMs),
   max:ms(d.maxMs),slow:String(d.slowQueries),failures:String(d.failures)};
  for(const [key,value] of Object.entries(data)){
   const el=values.get(key);if(el&&el.textContent!==value)el.textContent=value;
  }
  const n=win.VC_ANALYSIS_NORMALIZE_20524?.diagnostics?.();
  const normalized={normalizations:String(n?.normalizations??0),last:ms(n?.lastMs??0),
   average:ms(n?.averageMs??0),max:ms(n?.maxMs??0),
   slow:String(n?.slowNormalizations??0),failures:String(n?.failures??0)};
  for(const [key,value] of Object.entries(normalized)){
   const el=normalizedValues.get(key);if(el&&el.textContent!==value)el.textContent=value;
  }
  const o=win.VC_ANALYSIS_OPERATIONS_20525?.diagnostics?.();
  const operational={operations:String(o?.operations??0),filters:String(o?.filters??0),
   evaluations:String(o?.evaluations??0),points:String(o?.points??0),
   coverage:String(o?.coverage??0),reconciliations:String(o?.reconciliations??0),
   average:ms(o?.averageMs??0),slow:String(o?.slowOperations??0),
   failures:String(o?.failures??0)};
  for(const [key,value] of Object.entries(operational)){
   const el=operationValues.get(key);if(el&&el.textContent!==value)el.textContent=value;
  }
  const e=win.VC_ANALYSIS_CSV_20526?.diagnostics?.(),
   i=win.VC_ANALYSIS_CSV_20526?.indexDiagnostics?.();
  const exported={exports:String(e?.exports??0),last:ms(e?.lastMs??0),
   average:ms(e?.averageMs??0),failures:String(e?.failures??0),
   builds:String(i?.builds??0),hits:String(i?.hits??0),
   invalidations:String(i?.invalidations??0),unsupported:String(i?.unsupported??0)};
  for(const [key,value] of Object.entries(exported)){
   const el=exportValues.get(key);if(el&&el.textContent!==value)el.textContent=value;
  }
 };
 refreshButton.addEventListener('click',refresh);refresh();
 const api:Readonly<QueryPerformancePanel>=Object.freeze({readOnly:true,refresh,
  dispose(){if(disposed)return;disposed=true;refreshButton.removeEventListener('click',refresh);
   section.remove();panels.delete(win);}
 });
 panels.set(win,api);return api;
}
