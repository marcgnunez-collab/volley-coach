/* V20.5.35 · Pure registration precondition decision.
 * Operates ONLY on booleans supplied by the ORIGINAL writer, not on match
 * objects, player data, video, scores, network, or local storage.
 */
export interface RegistrationConditions{
 readonly hasCode:boolean;
 readonly hasMatch:boolean;
 readonly matchFinished:boolean;
 readonly hasSet:boolean;
 readonly setFinished:boolean;
}
export type RegistrationGuardError='Código vacío.'|'No hay un scouting activo.'|'El set está cerrado.';

/** Native V8.5.7 precondition precedence is intentional and tested. */
export function inspectRegistrationConditions(
 conditions:Readonly<RegistrationConditions>):RegistrationGuardError|null{
 if(!conditions.hasCode)return 'Código vacío.';
 if(!conditions.hasMatch||conditions.matchFinished)return 'No hay un scouting activo.';
 if(!conditions.hasSet||conditions.setFinished)return 'El set está cerrado.';
 return null;
}
