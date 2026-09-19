import type {Candidate} from './types';
const furniture=new Set(['dining table','table','chair','couch','bed','bench','tv','refrigerator']);
const category=(c:Candidate)=>c.person?'person':c.label.trim().toLowerCase();
/** One instance per category. Small foreground objects outrank supporting furniture. */
export function selectCandidates(candidates:Candidate[],includePeople:boolean):Candidate[]{
  const eligible=candidates.filter(c=>c.confidence>=.45&&(includePeople||!(c.person||category(c)==='person')));
  const score=(c:Candidate)=>c.confidence+Math.max(0,.5-c.bbox[2]*c.bbox[3])-(furniture.has(category(c))?2:0);
  const distinct=new Map<string,Candidate>();
  for(const c of [...eligible].sort((a,b)=>score(b)-score(a)))if(!distinct.has(category(c)))distinct.set(category(c),c);
  const objects=[...distinct.values()].filter(c=>!furniture.has(category(c)));
  return (objects.length?objects:[...distinct.values()]).slice(0,5);
}
