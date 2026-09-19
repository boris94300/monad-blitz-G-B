import type {Candidate} from './types';
export const trackingColors=['#00c2ff','#ac79ff','#34dfaa','#ffad4a','#ff6faf'];
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
  return [...previous.values()].sort((a,b)=>b.seen-a.seen).slice(0,5).map(x=>x.candidate);
}
