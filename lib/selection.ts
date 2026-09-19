import type {Candidate} from './types';
/** Number of lots kept on screen at once. */
export const MAX_LOTS=7;
const furniture=new Set(['dining table','table','chair','couch','bed','bench','tv','refrigerator']);
const category=(c:Candidate)=>c.person?'person':c.label.trim().toLowerCase();
/** Share of the smaller box covered by the intersection of two boxes. */
export function overlap(a:Candidate['bbox'],b:Candidate['bbox']){
  const w=Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0]),h=Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1]);
  return w>0&&h>0?w*h/Math.min(a[2]*a[3],b[2]*b[3]):0;
}
/** People-only mode: every visible person is a distinct lot, labelled person#1, person#2… Duplicates from overlapping tiles are merged. */
export function selectPeople(candidates:Candidate[],max=MAX_LOTS):Candidate[]{
  const people:Candidate[]=[];
  for(const c of candidates.filter(c=>c.confidence>=.45&&(c.person||category(c)==='person')).sort((a,b)=>b.confidence-a.confidence))
    if(!people.some(p=>overlap(p.bbox,c.bbox)>.6))people.push(c);
  return people.slice(0,max).map((c,i)=>({...c,person:true,label:`person#${i+1}`}));
}
/** One instance per category. Small foreground objects outrank supporting furniture. */
export function selectCandidates(candidates:Candidate[],includePeople:boolean,max=MAX_LOTS):Candidate[]{
  const eligible=candidates.filter(c=>c.confidence>=.45&&(includePeople||!(c.person||category(c)==='person')));
  const score=(c:Candidate)=>c.confidence+Math.max(0,.5-c.bbox[2]*c.bbox[3])-(furniture.has(category(c))?2:0);
  const distinct=new Map<string,Candidate>();
  for(const c of [...eligible].sort((a,b)=>score(b)-score(a)))if(!distinct.has(category(c)))distinct.set(category(c),c);
  const objects=[...distinct.values()].filter(c=>!furniture.has(category(c)));
  return (objects.length?objects:[...distinct.values()]).slice(0,max);
}
