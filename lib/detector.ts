import type {Candidate} from './types';
let worker:Worker|null=null;let counter=0;
const jobs=new Map<number,{resolve:(c:Candidate[])=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
let queue:Promise<unknown>=Promise.resolve();
function getWorker(){
  if(!worker){
    worker=new Worker(new URL('./detector.worker.ts',import.meta.url));
    worker.onmessage=(event:MessageEvent<{id:number;candidates:Candidate[];error?:string}>)=>{
      const job=jobs.get(event.data.id);if(!job)return;jobs.delete(event.data.id);clearTimeout(job.timer);
      if(event.data.error)job.reject(Error(event.data.error));else job.resolve(event.data.candidates);
    };
    worker.onerror=()=>{for(const job of jobs.values()){clearTimeout(job.timer);job.reject(Error('La reconnaissance n’a pas pu démarrer. Rechargez la page.'));}jobs.clear();worker?.terminate();worker=null;};
  }
  return worker;
}
export function detect(snapshot:HTMLCanvasElement,detailed=false,focus:Candidate['bbox'][]=[]):Promise<Candidate[]>{
  const job=queue.then(()=>new Promise<Candidate[]>((resolve,reject)=>{
    const active=getWorker(),id=++counter;
    const pixels=snapshot.getContext('2d')!.getImageData(0,0,snapshot.width,snapshot.height);
    const timer=setTimeout(()=>{jobs.delete(id);active.terminate();if(worker===active)worker=null;reject(Error('La reconnaissance prend trop de temps. Réessayez.'));},60000);
    jobs.set(id,{resolve,reject,timer});active.postMessage({id,width:snapshot.width,height:snapshot.height,pixels:pixels.data.buffer,detailed,focus},[pixels.data.buffer]);
  }));queue=job.catch(()=>{});return job;
}
