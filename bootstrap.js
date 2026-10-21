(()=>{
'use strict';
const APP_VERSION='6.11.0',SCHEMA_VERSION=1,ERROR_KEY='volley_core_error_log_v611',MAX_ERRORS=50;
const now=()=>new Date().toISOString();
const safeParse=(v,fallback=null)=>{try{return JSON.parse(v)}catch(_){return fallback}};
const errorText=e=>{try{return String(e?.message||e?.reason?.message||e?.reason||e||'Error desconocido')}catch(_){return 'Error desconocido'}};
const pushError=entry=>{try{const list=safeParse(localStorage.getItem(ERROR_KEY),'')||[];list.push(entry);while(list.length>MAX_ERRORS)list.shift();localStorage.setItem(ERROR_KEY,JSON.stringify(list))}catch(_){}};
window.addEventListener('error',e=>pushError({at:now(),type:'error',message:errorText(e.error||e.message),source:e.filename||'',line:e.lineno||0,column:e.colno||0}));
window.addEventListener('unhandledrejection',e=>pushError({at:now(),type:'promise',message:errorText(e)}));
const core=window.VC_CORE=window.VC_CORE||{};
Object.assign(core,{appVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION,errorKey:ERROR_KEY,startedAt:now(),migrations:core.migrations||[],
 uid(prefix='id'){let token='';try{token=crypto.randomUUID()}catch(_){token=`${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`}return `${prefix}_${token}`},
 registerMigration(name,fn){if(typeof fn==='function')this.migrations.push({name:String(name||`migration_${this.migrations.length+1}`),fn})},
 errorLog(){try{return safeParse(localStorage.getItem(ERROR_KEY),'')||[]}catch(_){return []}},
 clearErrorLog(){try{localStorage.removeItem(ERROR_KEY)}catch(_){}},
 diagnostics(){const log=this.errorLog();return {appVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION,startedAt:this.startedAt,errorCount:log.length,lastError:log.slice(-1)[0]||null}}
});
console.info(`Volley Coach ${APP_VERSION} · core bootstrap OK`);
})();
