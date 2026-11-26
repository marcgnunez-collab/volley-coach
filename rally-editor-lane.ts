/* V20.5.77 · Pure rally-editor commands and guarded parse preparation.
 * No match, rally, score, video, journal or cloud writes live in this module.
 * Historical editor remains the ONLY owner of the final edit/save/backup.
 */
export interface RallyEditorScope<Match,Set,Rally,Action>{
 readonly match:Match;readonly set:Set;readonly rally:Rally;
 readonly sourceActions:readonly Action[];readonly signature:string;
}
export interface RallyEditorCurrent<Match,Set,Rally,Action>{
 readonly match:Match|null;readonly set:Set|null;readonly rally:Rally|null;
 readonly actions:readonly Action[]|null;
}

function actionSignature(actions:readonly unknown[]):string|null{
 try{
  const value=JSON.stringify(actions);
  return typeof value==='string'?value:null;
 }catch(_){return null}
}

export function captureRallyEditorScope<Match,Set,Rally,Action>(input:{
 readonly match:Match;readonly set:Set;readonly rally:Rally;
 readonly actions:readonly Action[];
}):Readonly<RallyEditorScope<Match,Set,Rally,Action>>|null{
 if(!input.match||!input.set||!input.rally||!Array.isArray(input.actions))return null;
 const signature=actionSignature(input.actions);
 if(signature===null)return null;
 return Object.freeze({match:input.match,set:input.set,rally:input.rally,
  sourceActions:input.actions,signature});
}

export function isRallyEditorScopeCurrent<Match,Set,Rally,Action>(
 scope:RallyEditorScope<Match,Set,Rally,Action>|null|undefined,
 current:RallyEditorCurrent<Match,Set,Rally,Action>):boolean{
 return !!scope&&current.match===scope.match&&current.set===scope.set&&
  current.rally===scope.rally&&current.actions===scope.sourceActions&&
  current.actions!==null&&actionSignature(current.actions)===scope.signature;
}

export type RallyDraftCommand<Action>=
 | {readonly type:'remove';readonly index:number}
 | {readonly type:'move';readonly index:number;readonly delta:number}
 | {readonly type:'insert';readonly index:number;readonly action:Action};

/** Preserve unsaved code-input edits when the user moves or duplicates a row.
 * Never touch the rally's original action objects. */
export function syncRallyEditorDraftCodes<Action extends {code?:string}>(input:{
 readonly actions:readonly Action[];readonly codes:readonly (string|undefined)[];
}):readonly Action[]{
 return input.actions.map((action,i)=>{
  const raw=input.codes[i];
  return typeof raw==='string'&&raw!==action.code?{...action,code:raw}:action;
 });
}

export function changeRallyEditorDraft<Action>(input:{
 readonly actions:readonly Action[];readonly command:RallyDraftCommand<Action>;
}):{readonly changed:boolean;readonly actions:readonly Action[]}{
 const {actions,command}=input;
 if(!Array.isArray(actions)||!Number.isInteger(command.index))
  return {changed:false,actions};
 const next=actions.slice();
 if(command.type==='remove'){
  if(command.index<0||command.index>=next.length)return {changed:false,actions};
  next.splice(command.index,1);
 }else if(command.type==='move'){
  const dest=command.index+command.delta;
  if(!Number.isInteger(command.delta)||command.index<0||command.index>=next.length||
     dest<0||dest>=next.length||dest===command.index)return {changed:false,actions};
  const [action]=next.splice(command.index,1);
  next.splice(dest,0,action);
 }else if(command.type==='insert'){
  if(command.index<0||command.index>next.length||!command.action)
   return {changed:false,actions};
  next.splice(command.index,0,command.action);
 }else return {changed:false,actions};
 return {changed:true,actions:next};
}

export interface RallyEditorCode<Action>{readonly raw:string;readonly oldAction:Action}
export type RallyEditPreparation<Action>=
 | {readonly ok:false;readonly kind:'stale';readonly error:string}
 | {readonly ok:false;readonly kind:'invalid';readonly error:unknown;readonly index:number}
 | {readonly ok:true;readonly actions:Action[]};

export function prepareRallyCorrection<Match,Set,Rally,Action extends {seq?:number}>(input:{
 readonly scope:RallyEditorScope<Match,Set,Rally,Action>;
 readonly current:()=>RallyEditorCurrent<Match,Set,Rally,Action>;
 readonly codes:readonly RallyEditorCode<Action>[];
 readonly parse:(raw:string,oldAction:Action)=>{error?:unknown;action?:Action};
}):RallyEditPreparation<Action>{
 const stale=():RallyEditPreparation<Action>=>({ok:false,kind:'stale',
  error:'El partido o rally se ha modificado. Vuelve a abrir el editor.'});
 if(!isRallyEditorScopeCurrent(input.scope,input.current()))return stale();
 const actions:Action[]=[];
 for(let i=0;i<input.codes.length;i++){
  if(!isRallyEditorScopeCurrent(input.scope,input.current()))return stale();
  const {raw,oldAction}=input.codes[i];
  const parsed=input.parse(raw,oldAction);
  if(parsed?.error||!parsed?.action)return {ok:false,kind:'invalid',
   error:parsed?.error||'Código no reconocido.',index:i};
  parsed.action.seq=i+1;
  actions.push(parsed.action);
 }
 if(!isRallyEditorScopeCurrent(input.scope,input.current()))return stale();
 return {ok:true,actions};
}
