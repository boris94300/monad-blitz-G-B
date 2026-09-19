import type {Candidate} from './types';
/** Gives each detected person the label of the nearest known person, so a lot keeps following the same person between frames. */
export function matchPeople(detected:Candidate[],known:{label:string;bbox:Candidate['bbox']}[]):Candidate[]{
  const center=(b:Candidate['bbox'])=>[b[0]+b[2]/2,b[1]+b[3]/2];
  const pairs=detected.flatMap((d,i)=>known.map(k=>{const [a,b]=center(d.bbox),[c,e]=center(k.bbox);return {i,label:k.label,distance:Math.hypot(a-c,b-e)};}))
    .filter(p=>p.distance<.25).sort((a,b)=>a.distance-b.distance);
  const labels=new Map<number,string>(),taken=new Set<string>();
  for(const p of pairs)if(!labels.has(p.i)&&!taken.has(p.label)){labels.set(p.i,p.label);taken.add(p.label);}
  const used=new Set([...known.map(k=>k.label),...taken]);let next=1;
  return detected.map((d,i)=>{let label=labels.get(i);if(!label){while(used.has(`person#${next}`))next++;label=`person#${next}`;used.add(label);}return {...d,person:true,label};});
}
export const trackingColors=['#00c2ff','#ac79ff','#34dfaa','#ffad4a','#ff6faf','#f2e34c','#ff6b5b'];
export function trackingColor(label:string,lots:{detectionLabel?:string;label:string}[]){
  const index=lots.findIndex(l=>(l.detectionLabel||l.label)===label);
  return trackingColors[index<0?[...label].reduce((sum,c)=>sum+c.charCodeAt(0),0)%trackingColors.length:index%trackingColors.length];
}
export function stabilize(previous:Map<string,{candidate:Candidate;seen:number}>,next:Candidate[],now:number,includePeople:boolean):Candidate[]{
  for(const c of next){
    const old=previous.get(c.label);const bbox=c.bbox.map((value,i)=>old&&now-old.seen<1000?old.candidate.bbox[i]*.25+value*.75:value) as Candidate['bbox'];
    previous.set(c.label,{candidate:{...c,bbox},seen:now});
  }
  for(const [label,item] of previous)if(now-item.seen>1000||(!includePeople&&item.candidate.person))previous.delete(label);
  return [...previous.values()].sort((a,b)=>b.seen-a.seen).map(x=>x.candidate);
}
