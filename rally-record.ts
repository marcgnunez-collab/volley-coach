/* V20.5.57 · Deterministic, pure rally records for the original native point/undo writers.
 * Callers supply already-cloned snapshots and timestamps: no clocks, globals,
 * storage, cloud, video or additional cloning is performed here.
 */
type Row=Record<string,unknown>;
const row=(value:unknown):Row|null=>value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Row:null;
const plain=(value:Row)=>{const proto=Object.getPrototypeOf(value);return proto===null||Object.getPrototypeOf(proto)===null;};

/** Owns the persisted shape of a closed rally, not the mutation that scores it. */
export function assembleClosedRally(source:unknown):Readonly<Row>|null{
 const x=row(source),live=row(x?.live),before=row(x?.before);
 if(!x||!live||!before)return null;
 return {
  id:live.id,setNumber:x.setNumber,
  servingBefore:before.servingBefore,rotationBefore:before.rotationBefore,
  opponentRotationBefore:before.opponentRotationBefore,
  lineupBefore:x.lineupBefore,baseLineupBefore:x.baseBefore,
  liberoBefore:x.liberoBefore,lineupRolesBefore:x.rolesBefore,
  scoreBefore:x.scoreBefore,
  scoreAfter:{us:x.scoreUs,opponent:x.scoreOpponent},
  winner:x.winner==='opponent'?'opponent':'ours',actions:x.actions,
  startedAt:live.startedAt,endedAt:x.endedAt,
  scoutStartMs:Number(live.scoutStartMs)||0,scoutEndMs:x.scoutEndMs
 };
}

/** Reassembles the current live rally from the last closed rally on undo. */
export function assembleRestoredLiveRally(source:unknown):Readonly<Row>|null{
 const x=row(source),r=row(x?.rally);
 if(!x||!r)return null;
 return {
  id:r.id,actions:x.actions,startedAt:r.startedAt,
  scoutStartMs:Number(r.scoutStartMs)||0,
  startSnapshot:{
   servingBefore:r.servingBefore,rotationBefore:r.rotationBefore,
   opponentRotationBefore:r.opponentRotationBefore||1,
   lineupBefore:x.lineupBefore,scoreBefore:x.scoreBefore
  }
 };
}

/** Bounded exact field/identity parity. Objects are compared by ordered keys;
 * arrays and copied lineup/actions remain referentially identical to native.
 */
export function sameRallyRecord(left:unknown,right:unknown,depth=0):boolean{
 if(Object.is(left,right))return true;
 if(depth>3)return false;
 const a=row(left),b=row(right);
 if(!a||!b||!plain(a)||!plain(b))return false;
 const keys=Reflect.ownKeys(a),other=Reflect.ownKeys(b);
 if(keys.length!==other.length)return false;
 return keys.every((key,index)=>{
  if(key!==other[index])return false;
  const first=Object.getOwnPropertyDescriptor(a,key),second=Object.getOwnPropertyDescriptor(b,key);
  return !!first&&!!second&&'value' in first&&'value' in second&&
   first.enumerable===second.enumerable&&sameRallyRecord(first.value,second.value,depth+1);
 });
}
