import type {Candidate} from './types';
let detector: Promise<import('@tensorflow-models/coco-ssd').ObjectDetection>|null=null;
export async function detect(snapshot:HTMLCanvasElement):Promise<Candidate[]> {
  if(!detector)detector=(async()=>{
    const tf=await import('@tensorflow/tfjs');await tf.ready();
    const coco=await import('@tensorflow-models/coco-ssd');return coco.load({base:'lite_mobilenet_v2',modelUrl:'/models/coco/model.json'});
  })().catch(e=>{detector=null;throw e;});
  const model=await detector;
  const predictions=await model.detect(snapshot,20,.45);
  return predictions.map(p=>({label:p.class,confidence:p.score,person:p.class==='person',bbox:[
    Math.max(0,p.bbox[0]/snapshot.width),Math.max(0,p.bbox[1]/snapshot.height),
    Math.min(1,p.bbox[2]/snapshot.width),Math.min(1,p.bbox[3]/snapshot.height)
  ]}));
}
