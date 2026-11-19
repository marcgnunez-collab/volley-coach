/* V20.5.14 · Read-only projections of native set closure and undo coverage.
 * Never imports a legacy writer, references players, or exposes stored media.
 */
import {asList,asRecord,asScore,isTeam,type Team} from './model';

export interface SetBoundary{
 readonly state:'projected'|'unknown';
 readonly target:15|25|null;
 readonly setFinished:boolean|null;
 readonly matchFinished:boolean|null;
 readonly setWinner:Team|null;
}
const unknownSet=():Readonly<SetBoundary>=>Object.freeze({state:'unknown',target:null,setFinished:null,matchFinished:null,setWinner:null});

/** Uses scoutSetTarget and scoutSetsScore rules, without closing a real set. */
export function projectSetBoundary(matchInput:unknown,scoreInput:unknown):Readonly<SetBoundary>{
 const match=asRecord(matchInput),score=asScore(scoreInput);
 if(!match||!score)return unknownSet();
 const number=Number(match.currentSet);
 if(!Number.isInteger(number)||number<1||number>5)return unknownSet();
 const current=asList(match.sets).map(asRecord).find(set=>set&&Number(set.number)===number);
 if(!current)return unknownSet();
 const target:15|25=number===5?15:25;
 const setFinished=(score.us>=target||score.opponent>=target)&&Math.abs(score.us-score.opponent)>=2;
 if(!setFinished)return Object.freeze({state:'projected',target,setFinished:false,matchFinished:false,setWinner:null});
 const setWinner:Team=score.us>score.opponent?'ours':'opponent';
 let previousWins=0;
 for(const setInput of asList(match.sets)){
  const set=asRecord(setInput);
  if(!set||set===current||set.finished!==true)continue;
  if(!isTeam(set.winner))return unknownSet();
  if(set.winner===setWinner)previousWins++;
 }
 return Object.freeze({state:'projected',target,setFinished:true,matchFinished:previousWins+1>=3,setWinner});
}

export type SnapshotCoverage='captured'|'native-fallback'|'missing';
export interface RallyRestorationCoverage{
 readonly lineup:SnapshotCoverage;
 readonly baseLineup:SnapshotCoverage;
 readonly libero:SnapshotCoverage;
 readonly roles:SnapshotCoverage;
 readonly actionsCaptured:boolean;
 readonly video:'linked'|'partial'|'not-linked';
 readonly readOnly:true;
}
/** Reports metadata coverage only: no lineup, player, media ID or video URL. */
export function inspectRallyRestoration(rallyInput:unknown):Readonly<RallyRestorationCoverage>{
 const rally=asRecord(rallyInput);
 const lineup=asRecord(rally?.lineupBefore);
 const hasLineup=!!asRecord(lineup?.ours)&&!!asRecord(lineup?.opponent);
 const captured=(value:unknown):boolean=>!!asRecord(value);
 const videoFields=['liveVideoSessionId','liveVideoStart','liveVideoEnd','liveVideoLinkedAt'];
 const videoCount=videoFields.filter(key=>rally?.[key]!==null&&rally?.[key]!==undefined).length;
 return Object.freeze({
  lineup:hasLineup?'captured':'missing',
  baseLineup:captured(rally?.baseLineupBefore)?'captured':hasLineup?'native-fallback':'missing',
  libero:captured(rally?.liberoBefore)?'captured':'native-fallback',
  roles:captured(rally?.lineupRolesBefore)?'captured':hasLineup?'native-fallback':'missing',
  actionsCaptured:Array.isArray(rally?.actions),
  video:videoCount===videoFields.length?'linked':videoCount?'partial':'not-linked',
  readOnly:true
 });
}
