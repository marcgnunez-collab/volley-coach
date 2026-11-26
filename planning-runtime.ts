/* V20.5.74 · Compatibility port; only read-only pure planning is delegated. */
import {classifyTrainingPlan,formatTrainingLocalDate,startOfTrainingWeek,totalTrainingMinutes}
 from './planning-core';

export interface TrainingPlanningBridge{
 readonly VERSION:'20.5.74';readonly pureOnly:true;
 readonly classifyPlan:typeof classifyTrainingPlan;
 readonly formatLocalDate:typeof formatTrainingLocalDate;
 readonly startOfWeek:typeof startOfTrainingWeek;
 readonly totalMinutes:typeof totalTrainingMinutes;
}
export type TrainingPlanningWindow=Window&{
 VC_TRAINING_PLANNING_20574?:Readonly<TrainingPlanningBridge>;
};
const mounted=new WeakMap<Window,Readonly<TrainingPlanningBridge>>();
export function installTrainingPlanningBridge(win:TrainingPlanningWindow):Readonly<TrainingPlanningBridge>{
 const existing=mounted.get(win);if(existing)return existing;
 const api:Readonly<TrainingPlanningBridge>=Object.freeze({
  VERSION:'20.5.74',pureOnly:true,
  classifyPlan:classifyTrainingPlan,formatLocalDate:formatTrainingLocalDate,
  startOfWeek:startOfTrainingWeek,totalMinutes:totalTrainingMinutes
 });
 mounted.set(win,api);
 if(!win.VC_TRAINING_PLANNING_20574)win.VC_TRAINING_PLANNING_20574=api;
 return api;
}
