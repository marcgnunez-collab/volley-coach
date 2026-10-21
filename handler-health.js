(()=>{
'use strict';
const REQUIRED=['scoutOpenNewMatch','scoutOpenLineup','scoutOpenSubstitution','scoutAwardPoint','scoutUndoRally','scoutRotate','scoutRotateOpponent','scoutAddCode','scoutAddManualAction','scoutDeleteLastAction','scoutOpenCodeReference','scoutExportPDF','scoutExportCSV','scoutExportJSON','scoutRenderAnalysis','scoutRenderPlayerAnalytics','scoutFinishMatch','scoutUpdateAdvancedFields','scoutRenderPerformanceAnalytics','scoutExportStatsCSV','scoutV630OpenDrill','scoutV630CloseDrill','scoutV630ResetFilters','scoutV640RenderTendencies','scoutV640SetMode','scoutV640ResetFilters','scoutV640OpenDrill','scoutV640CloseDrill'];
const missing=REQUIRED.filter(name=>typeof window[name]!=='function');
if(missing.length)console.error('Volley Coach V6.11.0 · funciones de scouting no disponibles:',missing);
else console.info('Volley Coach V6.11.0 · scouting handlers OK');
})();
