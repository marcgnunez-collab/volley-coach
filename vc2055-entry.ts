/* V20.5.5 · typed volleyball-domain library, with a read-only live consumer. */
import {mountDomainDiagnostic,inspectMatchDomain} from './domain/runtime';
import {mountShadowPanel} from './domain/shadow-runtime';
import {mountCommittedPanel} from './domain/committed-runtime';
import {mountGrammarPanel} from './domain/grammar-runtime';
import {mountObservablePanel} from './state/runtime';
import {createObservableMatchStore,projectObservableMatch} from './state/match-observable';
import {inspectLiveSetStatistics} from './state/live-statistics';
import {mountLiveStatisticsPanel} from './state/live-statistics-runtime';
import {inspectPlayerBoxscore} from './state/player-boxscore';
import {mountPlayerBoxscore} from './state/player-boxscore-runtime';
import {createScoutingProjectionStore,mountScoutingProjectionStore} from './state/scouting-projections';
import {readCanonicalMatch,canonicalReaders} from './state/match-state-contract';
import {mountRallyShadowPanel} from './domain/rally-shadow-runtime';
import {installMultiDeviceAPI,mountMultiDevicePanel} from './domain/multi-device-runtime';
export {inspectCodeShape,compareNativeCode} from './domain/code-grammar';
export {verifyRallyScore,auditMatchScores} from './domain/scoring';
export {nextRotation,projectPoint} from './domain/rotation';
export {planAwardPoint,planUndoLastRally,inspectClosedRally} from './domain/rally-transition';
export {projectSetBoundary,inspectRallyRestoration} from './domain/rally-boundaries';
export {compareConfirmedPoint,createRallyShadowSession} from './domain/rally-shadow';
export {createRallyTransactionPilot} from './domain/rally-transaction-pilot';
export {captureRecoveryFrame,changedRecoveryAreas,equalRecoveryFrames,classifyRecoveryEvidence}
 from './domain/rally-recovery-evidence';
export {inspectJournalRecovery} from './domain/journal-recovery-inspector';
export {reportDeviceValidation,parseDeviceValidation,compareDeviceValidation}
 from './domain/multi-device-validation';
export {installMultiDeviceAPI,mountMultiDevicePanel};
export {mountRallyShadowPanel};
export {attackEfficiency,sideOutBreakPoint} from './domain/statistics';
export {inspectSubstitution} from './domain/substitutions';
export {inspectMatchDomain,mountDomainDiagnostic};
export {classifyPreflight,createShadowSession} from './domain/shadow-validation';
export {mountShadowPanel};
export {classifyStoredAction,auditCommittedMatch} from './domain/committed-audit';
export {mountCommittedPanel};
export {mountGrammarPanel};
export {mountObservablePanel,createObservableMatchStore,projectObservableMatch};
export {inspectLiveSetStatistics,mountLiveStatisticsPanel};
export {inspectPlayerBoxscore,mountPlayerBoxscore};
export {createScoutingProjectionStore,mountScoutingProjectionStore};
export {readCanonicalMatch,canonicalReaders};

if(typeof window!=='undefined'&&window.document){
 installMultiDeviceAPI(window);
 const start=()=>{mountObservablePanel(window);mountScoutingProjectionStore(window);mountDomainDiagnostic(window);mountShadowPanel(window);mountCommittedPanel(window);mountGrammarPanel(window);mountLiveStatisticsPanel(window);mountPlayerBoxscore(window);mountRallyShadowPanel(window);mountMultiDevicePanel(window);};
 if(window.document.readyState==='loading')window.document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
}
