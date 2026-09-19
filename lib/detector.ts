import type {Candidate} from './types';
let detector: Promise<import('@tensorflow-models/coco-ssd').ObjectDetection>|null=null;
let queue:Promise<unknown>=Promise.resolve();
export function detect(snapshot:HTMLCanvasElement,detailed=false):Promise<Candidate[]> {
  const job=queue.then(()=>run(snapshot,detailed));queue=job.catch(()=>{});return job;
}
async function run(snapshot:HTMLCanvasElement,detailed:boolean):Promise<Candidate[]> {
  if(!detector)detector=(async()=>{
    const tf=await import('@tensorflow/tfjs');await tf.ready();
    const coco=await import('@tensorflow-models/coco-ssd');return coco.load({base:'lite_mobilenet_v2',modelUrl:'/models/coco/model.json'});
  })().catch(e=>{detector=null;throw e;});
  const model=await detector;
  const regions:number[][]=[[0,0,1,1]];
  if(detailed)regions.push([0,0,.6,.6],[.4,0,.6,.6],[0,.4,.6,.6],[.4,.4,.6,.6],[.2,.2,.6,.6]);
  const candidates:Candidate[]=[];
  for(const [x,y,w,h] of regions){
    const tile=document.createElement('canvas');tile.width=640;tile.height=Math.round(640*snapshot.height*h/(snapshot.width*w));
    tile.getContext('2d')!.drawImage(snapshot,x*snapshot.width,y*snapshot.height,w*snapshot.width,h*snapshot.height,0,0,tile.width,tile.height);
    for(const p of await model.detect(tile,30,.45)){
      const bx=Math.max(0,x+p.bbox[0]/tile.width*w),by=Math.max(0,y+p.bbox[1]/tile.height*h);
      candidates.push({label:p.class,confidence:p.score,person:p.class==='person',bbox:[bx,by,Math.max(.001,Math.min(1-bx,p.bbox[2]/tile.width*w)),Math.max(.001,Math.min(1-by,p.bbox[3]/tile.height*h))]});
    }
  }
  return candidates.sort((a,b)=>b.confidence-a.confidence).slice(0,150);
}
