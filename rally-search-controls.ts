/* V20.5.31 · Rally Search Pro interactions. Owns only search controls and
 * the existing optional local preset key; never native scouting or cloud data.
 */
import {normalizeRallySearchFilters,type SearchResult,type SearchFilterKey} from './analysis-query';

export const RALLY_SEARCH_PRESETS_KEY='vc1939:search-presets:1' as const;
export interface RallySearchPreset{
 readonly name:string;readonly filters:Readonly<Record<SearchFilterKey,string>>;
}
export type PresetStorage=Pick<Storage,'getItem'|'setItem'>;
const val=(value:unknown)=>String(value??'').trim();

/** Exact storage and validation parity with V19.3.9 readPresets. */
export function readRallySearchPresets(storage:Pick<Storage,'getItem'>|null|undefined):RallySearchPreset[]{
 try{
  const parsed:unknown=JSON.parse(storage?.getItem(RALLY_SEARCH_PRESETS_KEY)||'[]');
  if(!Array.isArray(parsed))return [];
  return parsed.filter(item=>item&&typeof item.name==='string'&&item.name.length<=40&&
   item.filters&&typeof item.filters==='object').slice(-15).map(item=>({
    name:item.name,filters:normalizeRallySearchFilters(item.filters)
   }));
 }catch(_){return []}
}

export interface RallySearchSession{
 filters:Record<string,unknown>;
 preset?:string;
 matchId:string;
 result:SearchResult;
 ctx:unknown;
}
export interface RallySearchControlPanel extends HTMLElement{
 _vc1939?:RallySearchSession;
 _vc1939Timer?:number;
}
export interface RallySearchControlHooks{
 readonly refresh:()=>void;
 readonly toCSV:(result:SearchResult)=>string;
}
export interface RallySearchControlMetrics{
 readonly nativeReadOnly:true;readonly bindings:number;readonly filters:number;
 readonly exports:number;readonly saved:number;readonly loaded:number;
 readonly deleted:number;readonly failures:number;
}
export interface RallySearchControls{
 readonly nativeReadOnly:true;readonly VERSION:'20.5.31';
 readonly readPresets:(storage:Pick<Storage,'getItem'>|null|undefined)=>RallySearchPreset[];
 readonly bind:(panel:RallySearchControlPanel,hooks:RallySearchControlHooks)=>boolean;
 readonly diagnostics:()=>Readonly<RallySearchControlMetrics>;
}
export type RallySearchControlsWindow=Window&{
 VC_RALLY_CONTROLS_20531?:Readonly<RallySearchControls>;
};
const installed=new WeakMap<Window,Readonly<RallySearchControls>>();

/** Adds three delegated listeners and keeps the original event semantics. */
export function installRallySearchControls(win:RallySearchControlsWindow):Readonly<RallySearchControls>{
 const previous=installed.get(win);if(previous)return previous;
 const browser=win as RallySearchControlsWindow&{Blob:typeof Blob;URL:typeof URL};
 const bound=new WeakSet<RallySearchControlPanel>();
 let bindings=0,filters=0,exports=0,saved=0,loaded=0,deleted=0,failures=0;
 const api:Readonly<RallySearchControls>=Object.freeze({
  VERSION:'20.5.31',nativeReadOnly:true,readPresets:readRallySearchPresets,
  bind(panel:RallySearchControlPanel,hooks:RallySearchControlHooks){
   if(!panel||typeof panel.addEventListener!=='function'||
    typeof panel.removeEventListener!=='function'||typeof hooks?.refresh!=='function'||
    typeof hooks?.toCSV!=='function')return false;
   if(bound.has(panel)){panel.dataset.vc1939Bound='yes';return true;}
   if(panel.dataset.vc1939Bound)return false; // Classic handlers already own this panel.
   const refreshLater=(delay:number)=>{
    win.clearTimeout(panel._vc1939Timer);
    panel._vc1939Timer=win.setTimeout(()=>{
     if(panel._vc1939?.ctx)hooks.refresh();
    },delay);
   };
   const onChange=(event:Event)=>{
    const target=event.target as HTMLElement&{value?:string};
    if(target?.matches?.('select[data-vc1939-filter]')){
     const s=panel._vc1939;if(!s)return;
     const key=target.dataset.vc1939Filter;if(!key)return;
     s.filters[key]=target.value??'';filters++;refreshLater(0);
    }
    if(target?.matches?.('[data-vc1939-preset]')&&panel._vc1939)
     panel._vc1939.preset=target.value;
   };
   const onInput=(event:Event)=>{
    const target=event.target as HTMLElement&{value?:string};
    if(!target?.matches?.('input[data-vc1939-filter]'))return;
    const s=panel._vc1939;if(!s)return;
    const key=target.dataset.vc1939Filter;if(!key)return;
    s.filters[key]=target.value??'';filters++;refreshLater(350);
   };
   const onClick=(event:Event)=>{
    const button=(event.target as HTMLElement|null)?.closest?.('button');
    if(!button)return;
    const session=panel._vc1939;if(!session?.ctx)return;
    if(button.hasAttribute('data-vc1939-clear')){
     session.filters={status:'closed'};filters++;hooks.refresh();return;
    }
    if(button.hasAttribute('data-vc1939-export')){
     try{
      const source=hooks.toCSV(session.result),blob=new browser.Blob([source],{
       type:'text/csv;charset=utf-8'}),url=browser.URL.createObjectURL(blob),
       a=panel.ownerDocument.createElement('a');
      a.href=url;
      a.download='volley-coach-rally-search-'+session.matchId.replace(/[^a-zA-Z0-9_-]/g,'_')+'.csv';
      panel.ownerDocument.body.append(a);a.click();a.remove();
      win.setTimeout(()=>browser.URL.revokeObjectURL(url),1000);exports++;
     }catch(_){failures++;/* blocked download must not alter the scouting record */}
     return;
    }
    if(button.hasAttribute('data-vc1939-save')){
     const name=win.prompt?.('Nombre de la búsqueda (máximo 40 caracteres)');
     if(!val(name))return;
     try{
      const storage=win.localStorage,shortName=val(name).slice(0,40),
       all=readRallySearchPresets(storage).filter(x=>x.name!==shortName);
      all.push({name:shortName,filters:normalizeRallySearchFilters(session.filters)});
      storage?.setItem(RALLY_SEARCH_PRESETS_KEY,JSON.stringify(all.slice(-15)));
      session.preset=shortName;saved++;hooks.refresh();
     }catch(_){failures++;}
     return;
    }
    if(button.hasAttribute('data-vc1939-load')){
     const item=readRallySearchPresets(win.localStorage).find(x=>x.name===session.preset);
     if(item){session.filters={...item.filters};loaded++;hooks.refresh();}
     return;
    }
    if(button.hasAttribute('data-vc1939-delete')){
     try{
      win.localStorage?.setItem(RALLY_SEARCH_PRESETS_KEY,
       JSON.stringify(readRallySearchPresets(win.localStorage).filter(x=>x.name!==session.preset)));
      session.preset='';deleted++;hooks.refresh();
     }catch(_){failures++;}
    }
   };
   const listeners:[string,EventListener][]=[['change',onChange],['input',onInput],['click',onClick]];
   const added:[string,EventListener][]=[];
   try{
    for(const [type,listener] of listeners){panel.addEventListener(type,listener);added.push([type,listener]);}
    panel.dataset.vc1939Bound='yes';bound.add(panel);bindings++;return true;
   }catch(_){
    for(const [type,listener] of added)panel.removeEventListener?.(type,listener);
    failures++;return false;
   }
  },
  diagnostics:()=>Object.freeze({nativeReadOnly:true as const,bindings,filters,exports,saved,
   loaded,deleted,failures})
 });
 installed.set(win,api);win.VC_RALLY_CONTROLS_20531=api;return api;
}
