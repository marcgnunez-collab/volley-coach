/* V20.5.5 · typed volleyball-domain library, with a read-only live consumer. */
import {mountDomainDiagnostic,inspectMatchDomain} from './domain/runtime';
import {mountShadowPanel} from './domain/shadow-runtime';
export {inspectCodeShape,compareNativeCode} from './domain/code-grammar';
export {verifyRallyScore,auditMatchScores} from './domain/scoring';
export {nextRotation,projectPoint} from './domain/rotation';
export {attackEfficiency,sideOutBreakPoint} from './domain/statistics';
export {inspectSubstitution} from './domain/substitutions';
export {inspectMatchDomain,mountDomainDiagnostic};
export {classifyPreflight,createShadowSession} from './domain/shadow-validation';
export {mountShadowPanel};

if(typeof window!=='undefined'&&window.document){
 const start=()=>{mountDomainDiagnostic(window);mountShadowPanel(window);};
 if(window.document.readyState==='loading')window.document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
}
