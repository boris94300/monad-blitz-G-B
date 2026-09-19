import type {Candidate} from './types';
let detector: Promise<import('@tensorflow-models/coco-ssd').ObjectDetection>|null=null;
let queue:Promise<unknown>=Promise.resolve();
async function run(snapshot:OffscreenCanvas,detailed:boolean,focus:Candidate['bbox'][]):Promise<Candidate[]> {
  if(!detector)detector=(async()=>{
    const tf=await import('@tensorflow/tfjs');try{await tf.setBackend('webgl');await tf.ready();}catch{await tf.setBackend('cpu');await tf.ready();}
    const coco=await import('@tensorflow-models/coco-ssd');return coco.load({base:'lite_mobilenet_v2',modelUrl:'/models/coco/model.json'});
  })().catch(e=>{detector=null;throw e;});
  const model=await detector;
  const regions:number[][]=[[0,0,1,1]];
  if(detailed)regions.push([0,0,.6,.6],[.4,0,.6,.6],[0,.4,.6,.6],[.4,.4,.6,.6],[.2,.2,.6,.6]);
  else for(const [x,y,w,h] of focus.slice(0,5)){
    if(w*h>.3)continue;
    const left=Math.max(0,x-w*.5),top=Math.max(0,y-h*.5);
    regions.push([left,top,Math.min(1-left,Math.max(.15,w*2)),Math.min(1-top,Math.max(.15,h*2))]);
  }
  const candidates:Candidate[]=[];
  for(const [x,y,w,h] of regions){
    const tile=new OffscreenCanvas(640,Math.round(640*snapshot.height*h/(snapshot.width*w)));
    tile.getContext('2d')!.drawImage(snapshot,x*snapshot.width,y*snapshot.height,w*snapshot.width,h*snapshot.height,0,0,tile.width,tile.height);
    for(const p of await model.detect(tile.getContext('2d')!.getImageData(0,0,tile.width,tile.height),30,.45)){
      const bx=Math.max(0,x+p.bbox[0]/tile.width*w),by=Math.max(0,y+p.bbox[1]/tile.height*h);
      candidates.push({label:p.class,confidence:p.score,person:p.class==='person',bbox:[bx,by,Math.max(.001,Math.min(1-bx,p.bbox[2]/tile.width*w)),Math.max(.001,Math.min(1-by,p.bbox[3]/tile.height*h))]});
    }
  }
  return candidates.sort((a,b)=>b.confidence-a.confidence).slice(0,150);
}

self.onmessage=(event:MessageEvent<{id:number;width:number;height:number;pixels:ArrayBuffer;detailed:boolean;focus:Candidate['bbox'][]}>)=>{
  const data=event.data;
  queue=queue.then(async()=>{
    try{
      const canvas=new OffscreenCanvas(data.width,data.height);canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(data.pixels),data.width,data.height),0,0);
      const candidates=await run(canvas,data.detailed,data.focus);self.postMessage({id:data.id,candidates});
    }catch(e){self.postMessage({id:data.id,error:e instanceof Error?e.message:'Reconnaissance indisponible.'});}
  });
};
