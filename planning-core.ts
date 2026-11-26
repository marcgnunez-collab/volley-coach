/* V20.5.74 · First active training-planning extraction from the classic runtime.
 * Pure, local-time calculations: no DOM, storage, network or global editor state.
 */
export interface TrainingPlanStatusInput{
 readonly id?:string|number|null;
 readonly fecha?:string|null;
 readonly realizado?:unknown;
 readonly historialId?:unknown;
}
export interface TrainingExerciseMinutes{readonly tiempo?:unknown}
export type TrainingPlanStatus=Readonly<{
 clase:'done'|'editing'|'pending'|'future';
 texto:'Realizado'|'En edición'|'En Historial · pendiente de marcar'|'Pendiente'|'Planificado';
}>;

export function formatTrainingLocalDate(date:Date=new Date()):string{
 const x=new Date(date),year=x.getFullYear();
 const month=String(x.getMonth()+1).padStart(2,'0');
 const day=String(x.getDate()).padStart(2,'0');
 return `${year}-${month}-${day}`;
}

export function startOfTrainingWeek(date:Date):Date{
 const monday=new Date(date),days=(monday.getDay()+6)%7;
 monday.setDate(monday.getDate()-days);
 monday.setHours(0,0,0,0);
 return monday;
}

/** Keep the editor's established Number()/falsy semantics for durations. */
export function totalTrainingMinutes(exercises:readonly TrainingExerciseMinutes[]|null|undefined):number{
 return (exercises||[]).reduce((sum,exercise)=>sum+(Number(exercise.tiempo)||0),0);
}

/** Keep the old decision priority, including already completed plans. */
export function classifyTrainingPlan(plan:TrainingPlanStatusInput,
 currentPlanId:unknown,today:string):TrainingPlanStatus{
 if(plan.realizado)return {clase:'done',texto:'Realizado'};
 if(Number(currentPlanId)===Number(plan.id))return {clase:'editing',texto:'En edición'};
 if(plan.historialId)return {clase:'pending',texto:'En Historial · pendiente de marcar'};
 if(plan.fecha!==undefined&&plan.fecha!==null&&plan.fecha<=today)
  return {clase:'pending',texto:'Pendiente'};
 return {clase:'future',texto:'Planificado'};
}
