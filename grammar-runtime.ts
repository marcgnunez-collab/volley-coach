/* V20.5.8 · Interactive, purely local syntax reference in Gestión.
 * It never calls the native parser or registers a scouting action.
 */
import {inspectCodeShape,type CodeShape} from './code-grammar';

interface GrammarAPI{
 readonly version:'20.5.8';
 readonly readOnly:true;
 readonly inspect:typeof inspectCodeShape;
 readonly dispose:()=>void;
}
type GrammarWindow=Window&{VC_CODE_GRAMMAR_2058?:Readonly<GrammarAPI>};

export function mountGrammarPanel(win:GrammarWindow):Readonly<GrammarAPI>|null{
 const doc=win.document,host=doc.getElementById('v11-management');
 if(!host)return null;
 if(win.VC_CODE_GRAMMAR_2058)return win.VC_CODE_GRAMMAR_2058;
 const node=(tag:string,className='',value='')=>{
  const item=doc.createElement(tag);item.className=className;item.textContent=value;return item;
 };
 const section=node('section','vc2058-grammar');section.id='vc2058-grammar';
 const heading=node('div','vc2058-heading'),title=node('div');
 title.append(node('small','','GRAMÁTICA DE CÓDIGOS · V20.5.8'),node('h3','','Referencia de código rápido'));
 heading.append(title,node('span','','No registra acciones'));
 const help=node('p','','Comprueba la estructura de un código localmente. Es una ayuda sintáctica: no verifica jugadores, rotaciones ni aceptación por el motor original.');
 const row=node('div','vc2058-entry');
 const label=node('label','','Código de prueba');label.setAttribute('for','vc2058-code');
 const field=node('input') as HTMLInputElement;field.id='vc2058-code';field.maxLength=160;
 field.placeholder='12A#.4B>5D*DC~T::31';field.setAttribute('autocomplete','off');field.setAttribute('spellcheck','false');
 const check=node('button','','Comprobar estructura') as HTMLButtonElement;check.type='button';
 row.append(label,field,check);
 const status=node('p','vc2058-status','Escribe un código para consultar la sintaxis.');status.setAttribute('role','status');
 const result=node('div','vc2058-result');
 const examples=node('p','vc2058-examples','Ejemplos: 7R#.6 · 12A#.4B>5D*DC · 3B#.4&12 · 12A#.4B>C5::31~T');
 section.append(heading,help,row,status,result,examples,
  node('p','vc2058-note','Los códigos introducidos no se guardan en el informe, en el historial ni en la nube. No se incorpora todavía la sintaxis completa DV4 (.dvw).'));
 const anchor=doc.getElementById('vc2057-committed')||doc.getElementById('vc2056-shadow');
 if(anchor?.parentNode===host)anchor.insertAdjacentElement('afterend',section);
 else host.insertAdjacentElement('afterbegin',section);
 let disposed=false;
 const inspect=()=>{
  if(disposed)return;
  const parsed=inspectCodeShape(field.value);
  section.dataset.state=parsed.state;
  status.textContent=parsed.state==='candidate'?'Estructura reconocida; aceptación del parser nativo no comprobada.':
   parsed.state==='empty'?'Escribe un código para consultar la sintaxis.':parsed.reason;
  result.replaceChildren();
  if(parsed.state==='empty')return;
  const entries:[string,string|null][]=[
   ['Equipo',parsed.team==='ours'?'Propio':parsed.team==='opponent'?'Rival':'—'],
   ['Fundamento',parsed.skill],['Valoración',parsed.evaluation],['Origen',parsed.startZone],['Destino',parsed.endZone],
   ['Saque',parsed.modifiers.serveType],['Combinación',parsed.modifiers.combination],
   ['Llamada',parsed.modifiers.dvCall],['Fase',parsed.modifiers.phase],
   ['Bloqueadores',parsed.modifiers.blockers],['Objetivo bloqueo',parsed.modifiers.blockTarget],
   ['Dirección',parsed.modifiers.direction],['Tempo',parsed.modifiers.tempo],
   ['Subtipo',parsed.modifiers.subtype],['Tipo colocación',parsed.modifiers.setType],
   ['Especial',parsed.modifiers.special],['Personalizado',parsed.modifiers.custom]
  ];
  for(const [name,value] of entries){
   if(!value||value==='—')continue;
   const item=node('span','vc2058-token');item.append(node('small','',name),node('b','',value));result.append(item);
  }
 };
 check.addEventListener('click',inspect);
 field.addEventListener('keydown',event=>{
  if(event.key==='Enter'){event.preventDefault();inspect();}
 });
 const api:Readonly<GrammarAPI>=Object.freeze({version:'20.5.8',readOnly:true,inspect:inspectCodeShape,
  dispose(){if(disposed)return;disposed=true;section.remove();
   if(win.VC_CODE_GRAMMAR_2058===api)delete win.VC_CODE_GRAMMAR_2058;}
 });
 win.VC_CODE_GRAMMAR_2058=api;
 return api;
}
