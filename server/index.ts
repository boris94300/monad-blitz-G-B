import dotenv from 'dotenv';
dotenv.config({path:'.env.local',quiet:true}); dotenv.config({quiet:true});
import express from 'express';
import {createServer} from 'node:http';
import {Server} from 'socket.io';
import next from 'next';
import {z} from 'zod';
import {createPublicClient, http, isAddress, parseEventLogs, formatEther, parseEther} from 'viem';
import {auctionAbi, monadTestnet} from '../lib/chain';
import {rooms,createRoom,publicRoom,selectCandidate,makeLot,sellDemo} from './rooms';
import type {InternalRoom} from './rooms';
import {candidateSchema,scanVision} from './vision';
import type {VisionCandidate} from './vision';
import type {Candidate} from '../lib/types';
import deployment from '../contracts/deployments.json';

const dev = !process.argv.includes('--production');
const port = Number(process.env.PORT || 3000);
const nextApp = next({dev, hostname:'0.0.0.0',port});
await nextApp.prepare();
const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'2mb'}));
const server = createServer(app);
const io = new Server(server,{maxHttpBufferSize:180_000, cors:{origin:false}, pingTimeout:20000});
const configuredAddress=process.env.CONTRACT_ADDRESS || deployment.address;
const address = configuredAddress && isAddress(configuredAddress) ? configuredAddress as `0x${string}` : null;
const client = createPublicClient({chain:monadTestnet,transport:http(process.env.MONAD_RPC_URL || monadTestnet.rpcUrls.default.http[0],{timeout:8000,retryCount:1})});
const iceServers:RTCIceServer[] = [{urls:'stun:stun.l.google.com:19302'}];
if (process.env.TURN_URL) iceServers.push({urls:process.env.TURN_URL,username:process.env.TURN_USERNAME,credential:process.env.TURN_CREDENTIAL});
const publish = (room:InternalRoom) => {room.lastTouched=Date.now();io.to(room.code).emit('room',publicRoom(room));};
const budgets=new Map<string,{count:number;until:number}>();
function limit(key:string,max:number,ms:number) {
  const old=budgets.get(key), now=Date.now();
  if(!old||old.until<now){budgets.set(key,{count:1,until:now+ms});return;}
  if(++old.count>max) throw new Error('Trop de demandes. Patientez un instant.');
}
app.use('/api',(req,res,next)=>{
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'GET') {
    const origin=req.headers.origin;
    if(origin && new URL(origin).host !== req.headers.host) {res.status(403).json({error:'Origine refusée.'});return;}
  }
  try{limit(req.ip||'local',180,60000);next();}catch{res.status(429).json({error:'Trop de demandes.'});}
});
function getRoom(code:string) {const r=rooms.get(code.toUpperCase());if(!r) throw new Error('Salle introuvable ou expirée. Vérifiez le code.');return r;}
function host(req:express.Request) {
  const room=getRoom(String(req.params.code));
  if(req.headers.authorization !== `Bearer ${room.hostToken}`) throw new Error('Seul le vendeur peut faire cela.');
  return room;
}
const imageSchema=z.string().max(1_500_000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/);
app.get('/api/config',(_req,res)=>res.json({vision:!!process.env.OPENAI_API_KEY,contractAddress:address,chainId:10143,publicUrl:process.env.PUBLIC_URL||'',iceServers}));
app.get('/api/health',(_req,res)=>res.json({ok:true,chainId:10143,contractConfigured:!!address}));
app.post('/api/rooms',(req,res)=>{
  limit(`create:${req.ip}`,8,60000);
  const body=z.object({name:z.string().trim().min(1).max(60),mode:z.enum(['demo','chain'])}).parse(req.body);
  if(body.mode==='chain'&&!address) throw new Error('Le contrat doit être déployé avant d’ouvrir une salle Monad.');
  if(rooms.size>=100) throw new Error('Toutes les salles sont occupées.');
  const room=createRoom(body.name,body.mode);res.json({room:publicRoom(room),hostToken:room.hostToken});
});
app.get('/api/rooms/:code',(req,res)=>res.json(publicRoom(getRoom(String(req.params.code)))));
app.post('/api/rooms/:code/scan',async(req,res)=>{
  const room=host(req);
  if(room.busy) throw new Error('L’expert réfléchit déjà.');
  if(room.active?.status==='active') throw new Error('Vendez le lot en cours avant de changer de cible.');
  if(Date.now()-room.lastScan<2500) throw new Error('Laissez deux secondes à notre expert.');
  const body=z.object({image:imageSchema,candidates:z.array(candidateSchema).max(30).optional(),includePeople:z.boolean().default(false),source:z.enum(['local','vision','rehearsal']),duration:z.number().int().min(15).max(180).default(60)}).parse(req.body);
  if(body.source==='rehearsal'&&room.mode!=='demo') throw new Error('Les objets de répétition sont réservés aux salles de répétition.');
  room.busy=true;room.lastScan=Date.now();
  try {
    const candidates:Candidate[]=body.source==='vision' ? await scanVision(body.image,body.includePeople) : body.candidates || [];
    const chosen=selectCandidate(candidates,body.includePeople);
    const lot=makeLot(chosen,body.image,room.mode,body.source);lot.duration=body.duration;
    if(body.source==='vision') {
      const enriched=chosen as VisionCandidate;
      Object.assign(lot,{name:enriched.name,description:enriched.description,title:enriched.title,traits:enriched.traits});
      lot.estimatedPrice=room.mode==='chain'?enriched.estimatedPrice:enriched.estimatedPrice*1000;
      lot.startPrice=Number((lot.estimatedPrice*2.5).toFixed(6));lot.floorPrice=Number((lot.estimatedPrice*.15).toFixed(6));
    }
    room.active=lot;publish(room);res.json({lot,count:candidates.filter(c=>body.includePeople||!c.person).length});
  } finally {room.busy=false;}
});
app.post('/api/rooms/:code/start',async(req,res)=>{
  const room=host(req),lot=room.active;
  if(!lot||lot.status!=='preview') throw new Error('Choisissez d’abord une cible.');
  if(room.busy) throw new Error('Opération déjà en cours.');
  room.busy=true;
  try{
    if(room.mode==='chain') {
      const hash=z.string().regex(/^0x[a-fA-F0-9]{64}$/).parse(req.body.txHash) as `0x${string}`;
      const receipt=await client.waitForTransactionReceipt({hash,timeout:30000});
      if(receipt.status!=='success') throw new Error('La transaction de mise en vente a échoué.');
      const logs=parseEventLogs({abi:auctionAbi,logs:receipt.logs.filter(l=>l.address.toLowerCase()===address!.toLowerCase()),eventName:'ItemListed'});
      const event=logs.find(e=>e.args.name===lot.name&&e.args.startPrice===parseEther(String(lot.startPrice))&&e.args.floorPrice===parseEther(String(lot.floorPrice))&&e.args.duration===lot.duration);
      if(!event) throw new Error('Cette transaction ne correspond pas au lot choisi.');
      if(Date.now()/1000-Number(event.args.startTime)>300) throw new Error('Transaction trop ancienne.');
      if([...rooms.values()].some(r=>r!==room && (r.active?.chainId===String(event.args.id)||r.history.some(l=>l.chainId===String(event.args.id))))) throw new Error('Ce lot est déjà lié à une autre salle.');
      lot.chainId=String(event.args.id);lot.startTime=Number(event.args.startTime)*1000;lot.txHash=hash;
    } else {lot.startTime=Math.floor(Date.now()/1000)*1000;}
    lot.status='active';publish(room);res.json(publicRoom(room));
  } finally {room.busy=false;}
});
app.post('/api/rooms/:code/buy',(req,res)=>{
  const room=getRoom(String(req.params.code));
  const body=z.object({buyer:z.string().trim().min(1).max(24),lotId:z.string().uuid()}).parse(req.body);
  if(room.active?.id!==body.lotId) throw new Error('Le lot a changé.');
  sellDemo(room,body.buyer);publish(room);res.json(publicRoom(room));
});
app.post('/api/rooms/:code/refresh',async(req,res)=>{
  const room=getRoom(String(req.params.code));await reconcile(room);res.json(publicRoom(room));
});
app.post('/api/rooms/:code/close',(req,res)=>{
  const room=host(req);room.live=false;room.lastFrame=undefined;
  if(room.hostSocket) io.to(room.hostSocket).emit('stop-live');
  io.to(room.code).emit('live-ended');publish(room);res.json({ok:true});
});

const polling=new Set<string>();
async function reconcile(room:InternalRoom) {
  const lot=room.active;
  if(!address||room.mode!=='chain'||lot?.status!=='active'||lot.chainId===undefined||polling.has(room.code)) return;
  polling.add(room.code);
  try{
    const item=await client.readContract({address,abi:auctionAbi,functionName:'getItem',args:[BigInt(lot.chainId)]});
    room.chainHealthy=true;
    if(item.sold && room.active?.id===lot.id && lot.status==='active') {
      lot.status='sold';lot.buyer=item.buyer;lot.soldPrice=Number(formatEther(item.soldPrice));
      room.history.push({...lot});room.history=room.history.slice(-12);publish(room);
    }
  }catch{if(room.chainHealthy){room.chainHealthy=false;publish(room);}}
  finally{polling.delete(room.code);}
}
setInterval(()=>{
  for(const r of rooms.values()) {
    if(!r.peers.size&&!r.hostSocket&&Date.now()-r.lastTouched>6*3600_000) rooms.delete(r.code);
    else void reconcile(r);
  }
  for(const [key,budget] of budgets) if(budget.until<Date.now()) budgets.delete(key);
},2000).unref();

io.on('connection',socket=>{
  let joined:InternalRoom|undefined, isHost=false, lastFrameAt=0;
  socket.on('join',(data,ack)=>{
    try{
      if(joined) throw new Error('Déjà connecté à une salle.');
      const input=z.object({code:z.string().regex(/^[A-F0-9]{8}$/),hostToken:z.string().optional()}).parse(data);
      const room=getRoom(input.code);
      isHost=input.hostToken===room.hostToken;
      if(!isHost&&room.peers.size>=40) throw new Error('La salle est pleine (40 spectateurs maximum).');
      if(input.hostToken&&!isHost) throw new Error('Accès vendeur invalide.');
      if(isHost&&room.hostSocket&&io.sockets.sockets.has(room.hostSocket)) throw new Error('La régie est déjà ouverte sur un autre appareil.');
      joined=room;socket.join(room.code);
      if(isHost) room.hostSocket=socket.id;else room.peers.add(socket.id);
      ack?.({ok:true,room:publicRoom(room),host:isHost});publish(room);
      if(!isHost&&room.lastFrame) socket.emit('frame',{image:room.lastFrame,at:Date.now()});
      if(!isHost&&room.hostSocket&&room.live) io.to(room.hostSocket).emit('viewer',socket.id);
    }catch(e){ack?.({error:e instanceof Error?e.message:'Connexion impossible.'});}
  });
  socket.on('live',value=>{
    if(!joined||!isHost||typeof value!=='boolean')return;
    joined.live=value;
    if(value) for(const id of joined.peers) socket.emit('viewer',id);
    else{joined.lastFrame=undefined;socket.to(joined.code).emit('live-ended');}
    publish(joined);
  });
  socket.on('frame',(image:unknown)=>{
    if(!joined||!isHost||!joined.live||Date.now()-lastFrameAt<200||typeof image!=='string'||image.length>170000||!image.startsWith('data:image/jpeg;base64,')) return;
    lastFrameAt=Date.now();joined.lastFrame=image;
    socket.to(joined.code).volatile.emit('frame',{image,at:Date.now()});
  });
  socket.on('signal',(data:unknown)=>{
    try{
      if(!joined) return;
      limit(`signal:${socket.id}`,200,60000);
      const {to,payload}=z.object({to:z.string().max(64),payload:z.unknown()}).parse(data);
      if(JSON.stringify(payload).length>24000) return;
      const allowed=isHost?joined.peers.has(to):to===joined.hostSocket;
      if(allowed) io.to(to).emit('signal',{from:socket.id,payload});
    }catch{}
  });
  socket.on('reaction',(emoji:string)=>{
    if(!joined||!['🔥','💀','🤌','🪑','💸'].includes(emoji))return;
    try{limit(`react:${socket.id}`,8,5000);io.to(joined.code).emit('reaction',{emoji,id:socket.id+Date.now()});}catch{}
  });
  socket.on('disconnect',()=>{
    if(!joined) return;
    joined.peers.delete(socket.id);
    if(isHost&&joined.hostSocket===socket.id){joined.hostSocket=undefined;joined.live=false;joined.lastFrame=undefined;io.to(joined.code).emit('live-ended');}
    else if(joined.hostSocket)io.to(joined.hostSocket).emit('viewer-left',socket.id);
    publish(joined);
  });
});
app.use('/api',(_req,res)=>res.status(404).json({error:'Route inconnue.'}));
app.use((err:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
  const message=err instanceof z.ZodError?'Données invalides. Vérifiez votre saisie.':err instanceof Error?err.message:'Une erreur est survenue.';
  res.status(400).json({error:message.slice(0,300)});
});
app.use((req,res)=>nextApp.getRequestHandler()(req,res));
server.listen(port,'0.0.0.0',()=>console.log(`BRIC À BRAC : http://localhost:${port} • ${address?'Monad configuré':'répétition disponible, contrat à déployer'}`));
