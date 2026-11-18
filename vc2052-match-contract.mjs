/* V20.5.2 pilot ES module: read-only projections over existing canonical matches.
 * Intended for future modular migration; not loaded into the live app yet.
 */
export const CONTRACT_VERSION='20.5.2';
const list=value=>Array.isArray(value)?value:[];
const integer=value=>Number.isInteger(value)&&value>=0?value:null;
export function verifyScoreTrace(rally){
 const before=rally?.scoreBefore,after=rally?.scoreAfter;
 const winner=rally?.winner;
 const bUs=integer(before?.us),bOp=integer(before?.opponent),aUs=integer(after?.us),aOp=integer(after?.opponent);
 if(!['ours','opponent'].includes(winner)||[bUs,bOp,aUs,aOp].some(x=>x==null))
  return Object.freeze({state:'unknown'});
 const valid=winner==='ours'?aUs===bUs+1&&aOp===bOp:aOp===bOp+1&&aUs===bUs;
 return Object.freeze({state:valid?'valid':'inconsistent'});
}
export function projectMatch(match){
 if(!match||typeof match!=='object')return Object.freeze({state:'unavailable'});
 let rallies=0,actions=0,knownWinners=0,scoreVerified=0,scoreInconsistent=0,scoreUnknown=0;
 for(const set of list(match.sets))for(const rally of list(set?.rallies)){
  if(!rally)continue;
  rallies++;
  actions+=list(rally.actions).filter(Boolean).length;
  if(rally.winner==='ours'||rally.winner==='opponent')knownWinners++;
  const trace=verifyScoreTrace(rally);
  if(trace.state==='valid')scoreVerified++;
  else if(trace.state==='inconsistent')scoreInconsistent++;
  else scoreUnknown++;
 }
 return Object.freeze({state:'available',matchId:match.id??null,status:String(match.status||'unknown'),
  sets:list(match.sets).length,rallies,actions,knownWinners,
  scoreTraces:Object.freeze({verified:scoreVerified,inconsistent:scoreInconsistent,unknown:scoreUnknown})});
}
