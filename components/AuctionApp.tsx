'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {usePathname} from 'next/navigation';
import {io, type Socket} from 'socket.io-client';
import {QRCodeSVG} from 'qrcode.react';
import {ArrowUpRight,ArrowRight,Camera,Radio,ScanLine,Users,Wallet,Volume2,VolumeX,Copy,Check,Shuffle,ChevronDown,ShieldCheck,MoveUpRight,Eye,VideoOff,Maximize2,LoaderCircle,Zap,Armchair,Sparkles,Play,Settings2,X,Trophy,ExternalLink} from 'lucide-react';
import {SaleMascot} from './SaleMascot';
import {stabilize,trackingColor,matchPeople} from '@/lib/tracking';
import type {Candidate} from '@/lib/types';
import {DetailPicker} from './DetailPicker';
import {LiveSelection,LotThumbnail} from './LiveSelection';
import {selectCandidates,selectPeople,MAX_LOTS} from '@/lib/selection';
import {describeOutfit} from '@/lib/appearance';
import type {TrackingFrame} from '@/lib/types';
import type {Config,Room,Lot} from '@/lib/types';
import {priceAt,formatMon,shortAddress,auctioneer} from '@/lib/auction';
import {useLive} from '@/lib/useLive';
import {connectWallet,listOnChain,buyOnChain,deployContract} from '@/lib/wallet';

const emptyIce:RTCIceServer[]=[];
/** A tracked lot missing from the camera this long is swapped for another visible object. */
const GONE_AFTER=2000;
/** A newcomer must stay visible this long before it can take a slot. */
const STEADY_FOR=500;
async function api<T>(path:string,body?:unknown,token?:string):Promise<T>{
  const res=await fetch(path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await res.json();if(!res.ok)throw new Error(data.error||'Connexion impossible.');return data;
}
function errorText(e:unknown){
  const raw=e instanceof Error?e.message:'Une erreur est survenue.';
  if(/rejected|denied|4001/i.test(raw))return 'Action annulée ou permission refusée. Vous pouvez réessayer.';
  if(/NotAllowedError|Permission denied/i.test(raw))return 'Autorisez la caméra dans votre navigateur pour lancer le live.';
  return raw.split('\n')[0].slice(0,240);
}
function Brand(){return <a className="brand" href="/"><span className="brand-icon"><Zap size={21} fill="currentColor"/></span>BRIC<span className="brand-small">À</span>BRAC<span className="brand-dot">®</span></a>;}
function Pill({children,className=''}:{children:React.ReactNode;className?:string}){return <span className={`pill ${className}`}>{children}</span>;}
function Video({stream,muted,className,onReady}:{stream:MediaStream|null;muted:boolean;className?:string;onReady?:(el:HTMLVideoElement)=>void}){
  const ref=useRef<HTMLVideoElement>(null);
  useEffect(()=>{if(ref.current){ref.current.srcObject=stream;void ref.current.play().catch(()=>{});onReady?.(ref.current);}},[stream,onReady]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} onLoadedData={e=>onReady?.(e.currentTarget)}/>;
}
function Money({value}:{value:number}){return <>{formatMon(value)} <small>MON</small></>;}

export default function AuctionApp(){
  const path=usePathname();const [config,setConfig]=useState<Config|null>(null);const [error,setError]=useState('');
  useEffect(()=>{api<Config>('/api/config').then(setConfig).catch(e=>setError(errorText(e)));},[]);
  const parts=path.split('/').filter(Boolean);
  if(parts[0]==='setup')return <Setup config={config}/>;
  if(parts[0]==='camera'&&parts[1])return <CameraPage config={config} code={parts[1].toUpperCase()}/>;
  if(['host','join','scene'].includes(parts[0])&&parts[1])return <RoomPage config={config} code={parts[1].toUpperCase()} role={parts[0] as 'host'|'join'|'scene'}/>;
  return <Home config={config} initialError={error}/>;
}

function Home({config,initialError}:{config:Config|null;initialError:string}){
  const [code,setCode]=useState('');const [name,setName]=useState('La liquidation du futur');
  const [mode,setMode]=useState<'demo'|'chain'>('demo');const [creating,setCreating]=useState(false);const [form,setForm]=useState(false);const [error,setError]=useState(initialError);
  const [nameError,setNameError]=useState('');const [codeError,setCodeError]=useState('');const [trap,setTrap]=useState('');const openedAt=useRef(0);
  async function create(){
    const clean=name.trim();
    if(!clean){setNameError('Donnez un nom à votre salle (1 à 60 caractères).');return;}
    setNameError('');setCreating(true);setError('');try{
    const data=await api<{room:Room;hostToken:string}>('/api/rooms',{name:clean,mode,website:trap,elapsed:Date.now()-openedAt.current});
    localStorage.setItem(`host:${data.room.code}`,data.hostToken);location.href=`/host/${data.room.code}`;
  }catch(e){setError(errorText(e));setCreating(false);}}
  async function join(e:React.FormEvent){e.preventDefault();setError('');
    const value=code.trim().toUpperCase();
    if(!/^[A-F0-9]{8}$/.test(value)){setCodeError('Le code compte 8 caractères : chiffres de 0 à 9 et lettres de A à F (ex. A1B2C3D4).');return;}
    if(trap)return;setCodeError('');
    try{const r=await api<Room>(`/api/rooms/${encodeURIComponent(value)}`);location.href=`/join/${r.code}`;}catch(e){setError(errorText(e));}}
  return <div className="landing">
    <header className="topbar"><Brand/><nav><a href="#concept">Le concept <ArrowUpRight size={14}/></a><Pill className="network"><span className="dot"/> Monad Testnet</Pill></nav></header>
    <main id="contenu">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="tiny-star">✳</span> MAISON DE VENTE · OBJETS EXTRAORDINAIREMENT ORDINAIRES</div>
          <h1>Le luxe de<br/>l’absurde<span className="purple">.</span><br/><span className="serif">Le prix de l’instant.</span></h1>
          <p className="hero-description">Votre pièce devient une salle de vente. Sept objets, repérés par IA. Les prix descendent en direct. <strong>Le premier qui craque gagne.</strong></p>
          <div className="hero-buttons"><button className="button primary" onClick={()=>{openedAt.current=Date.now();setForm(true);}}>Ouvrir ma salle <ArrowUpRight size={20}/></button></div>
          <div className="hero-footnote"><ShieldCheck size={15}/> Objets fictifs. Monnaie de test. Dignité optionnelle.</div>
        </div>
        <div className="hero-visual" aria-label="Illustration d’une vente aux enchères fictive"><div className="orbit orbit-one"/><div className="orbit orbit-two"/>
          <div className="preview-card"><div className="preview-top"><Pill className="live-pill"><span className="dot"/> EXEMPLE DE LOT</Pill><span className="mono">LOT 001</span></div>
          <div className="chair-scene"><div className="scan-corner tl"/><div className="scan-corner tr"/><div className="scan-corner bl"/><div className="scan-corner br"/><Armchair strokeWidth={1} size={168}/><span className="target-tag">chaise · prestige suspect</span><div className="chair-shadow"/></div>
          <div className="preview-info"><span className="eyebrow">EXPERTISE HAUTEMENT DISCUTABLE</span><h2>Trône du<br/>stagiaire suprême.</h2><div className="preview-bottom"><span><strong>12,500</strong> MON <ChevronDown size={20}/></span><div className="round-arrow"><ArrowUpRight/></div></div></div>
          </div><div className="sticker"><Sparkles size={18}/><span>Certifié<br/><b>probablement rare.</b></span></div><div className="scribble">attendez…<br/>ou regrettez. ↗</div>
        </div>
      </section>
      <div className="ticker"><span>UNE EXPERTISE DOUTEUSE</span><span>✳</span><span>UN VRAI SUSPENSE</span><span>✳</span><span>ZÉRO OBJET RÉEL VENDU</span><span>✳</span><span>100 % CHAOS ORGANISÉ</span><span>✳</span></div>
      <section className="how" id="concept"><div className="section-heading"><span className="eyebrow">LE PROTOCOLE DU GRAND N’IMPORTE QUOI</span><h2>Trois étapes.<br/>Aucune expertise sérieuse.</h2></div><div className="steps"><article><span className="step-number">01 /</span><Camera/><h3>Visez le banal.</h3><p>Un téléphone filme la pièce. Toute la salle regarde en direct.</p></article><article><span className="step-number">02 /</span><Shuffle/><h3>Révélez les pépites.</h3><p>L’IA en choisit toujours sept. S’il manque des objets, elle vend un pan de mur ou une parcelle d’air.</p></article><article><span className="step-number">03 /</span><Zap/><h3>Craquez au bon moment.</h3><p>Le prix descend. Attendez un peu… mais pas une personne de plus.</p></article></div></section>
      <section className="join-section" id="join"><div><span className="eyebrow">LA SALLE VOUS ATTEND</span><h2>Un code. Et du mauvais goût.</h2><p>Entrez le code partagé par votre commissaire-priseur.</p></div><form onSubmit={join} noValidate><label className="sr-only" htmlFor="room-code">Code de la salle</label><input id="room-code" value={code} onChange={e=>{setCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g,''));setCodeError('');}} placeholder="A1B2C3D4" maxLength={8} autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text" pattern="[A-F0-9]{8}" aria-invalid={!!codeError} aria-describedby={codeError?'room-code-error':undefined} required/><div className="hp" aria-hidden="true"><label>Ne pas remplir<input tabIndex={-1} autoComplete="off" name="website" value={trap} onChange={e=>setTrap(e.target.value)}/></label></div><button className="button dark" type="submit">Rejoindre la salle <ArrowRight size={18}/></button>{codeError&&<p id="room-code-error" className="field-error" role="alert">{codeError}</p>}</form></section>
      {error&&<p className="error home-error" role="alert">{error}</p>}
    </main><footer><Brand/><span>Construit pour le chaos. Propulsé par Monad.</span><nav className="footer-links" aria-label="Liens légaux"><a href="/cgu">Conditions d’utilisation</a><a href="/confidentialite">Confidentialité</a><button type="button" data-cookie-settings>Gérer les cookies</button><a href="/setup">Installation <Settings2 size={13}/></a></nav></footer>
    {form&&<div className="modal-backdrop" onClick={()=>setForm(false)} onKeyDown={e=>{if(e.key==='Escape')setForm(false);}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title" onClick={e=>e.stopPropagation()}><button className="icon-button close" aria-label="Fermer" onClick={()=>setForm(false)}><X/></button><span className="eyebrow">LE COMMISSAIRE, C’EST VOUS.</span><h2 id="create-title">Ouvrez les hostilités.</h2><label>Nom de la salle<input value={name} maxLength={60} required aria-invalid={!!nameError} aria-describedby={nameError?'room-name-error':undefined} onChange={e=>{setName(e.target.value);setNameError('');}}/></label>{nameError&&<p id="room-name-error" className="field-error" role="alert">{nameError}</p>}<div className="hp" aria-hidden="true"><label>Ne pas remplir<input tabIndex={-1} autoComplete="off" name="website" value={trap} onChange={e=>setTrap(e.target.value)}/></label></div><div className="mode-options"><button className={mode==='demo'?'selected':''} onClick={()=>setMode('demo')}><Play size={18}/><strong>Répétition</strong><small>Sans wallet · achats simulés</small></button><button disabled={!config?.contractAddress} className={mode==='chain'?'selected':''} onClick={()=>setMode('chain')}><Zap size={18}/><strong>Monad Testnet</strong><small>{config?.contractAddress?'Vraies transactions de test':'Contrat à déployer'}</small></button></div><p className="muted small">La caméra démarre uniquement lorsque vous l’activez dans la salle. Partagez le lien avec les personnes qui peuvent regarder.</p>{error&&<p className="error" role="alert">{error}</p>}<button className="button primary full" disabled={creating} onClick={create}>{creating?<LoaderCircle className="spin"/>:<>Créer la salle <ArrowUpRight size={19}/></>}</button></section></div>}
  </div>;
}

function RoomPage({config,code,role}:{config:Config|null;code:string;role:'host'|'join'|'scene'}){
  const host=role==='host';const scene=role==='scene';
  const [room,setRoom]=useState<Room|null>(null);const [socket,setSocket]=useState<Socket|null>(null);const [connected,setConnected]=useState(false);
  const [token,setToken]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState('');const [notice,setNotice]=useState('');
  const [wallet,setWallet]=useState('');const [nickname,setNickname]=useState('');const [includePeople,setIncludePeople]=useState(false);const [peopleOnly,setPeopleOnly]=useState(false);
  const [mic,setMic]=useState(false);const [muted,setMuted]=useState(true);const [duration,setDuration]=useState(60);const [remoteVision,setRemoteVision]=useState(false);
  const [now,setNow]=useState(Date.now());const offset=useRef(0);const videoRef=useRef<HTMLVideoElement|null>(null);const [cameraReady,setCameraReady]=useState(false);
  const [copied,setCopied]=useState(false);const [reactions,setReactions]=useState<{emoji:string;id:string}[]>([]);
  const [phonePanel,setPhonePanel]=useState(false);const [cameraToken,setCameraToken]=useState('');
  const [detailImage,setDetailImage]=useState('');
  const [selectedId,setSelectedId]=useState('');const [tracking,setTracking]=useState<TrackingFrame|null>(null);const [trackingError,setTrackingError]=useState('');
  const pendingList=useRef<{lotId:string;hash:string}|null>(null);
  const live=useLive(socket,host,config?.iceServers||emptyIce);
  const announceRef=useRef(live.announce);announceRef.current=live.announce;
  const readyVideo=useCallback((v:HTMLVideoElement)=>{videoRef.current=v;setCameraReady(v.videoWidth>0);},[]);
  useEffect(()=>{if(!live.stream&&!live.remote)setCameraReady(false);},[live.stream,live.remote]);
  const update=useCallback((r:Room)=>{offset.current=r.serverTime-Date.now();setRoom(r);},[]);
  useEffect(()=>{setNickname(localStorage.getItem('nickname')||'Collectionneur anonyme');},[]);
  useEffect(()=>{if(host&&token)api<{cameraToken:string}>(`/api/rooms/${code}/camera-access`,undefined,token).then(r=>setCameraToken(r.cameraToken)).catch(e=>setError(errorText(e)));},[host,token,code]);
  useEffect(()=>{
    if(!config)return;
    const hostToken=host?localStorage.getItem(`host:${code}`)||'':'';setToken(hostToken);
    if(host&&!hostToken){setError('Ce navigateur n’a pas l’accès vendeur. Ouvrez le lien de régie sur l’appareil qui a créé la salle.');return;}
    const s=io({transports:['websocket','polling']});setSocket(s);
    s.on('connect',()=>{
      s.emit('join',{code,...(host?{hostToken}:{})},(reply:{error?:string;room:Room})=>{
        if(reply.error){setError(reply.error);setConnected(false);return;}
        setConnected(true);update(reply.room);announceRef.current();
      });
    });
    s.on('tracking',setTracking);
    s.on('room',update);s.on('disconnect',()=>setConnected(false));
    s.on('connect_error',()=>setError('Connexion à la salle interrompue. Nouvelle tentative automatique…'));
    s.on('reaction',(r:{emoji:string;id:string})=>{setReactions(old=>[...old.slice(-5),r]);setTimeout(()=>setReactions(old=>old.filter(x=>x.id!==r.id)),2500);});
    return()=>{s.disconnect();setSocket(null);};
  },[config,code,host,update]);
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()+offset.current),100);return()=>clearInterval(t);},[]);
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),6000);return()=>clearTimeout(t);},[notice]);
  const act=async(label:string,fn:()=>Promise<void>)=>{setBusy(label);setError('');try{await fn();}catch(e){setError(errorText(e));}finally{setBusy('');}};
  const joinUrl=typeof window==='undefined'?'':`${config?.publicUrl||window.location.origin}/join/${code}`;
  const cameraUrl=typeof window==='undefined'?'':`${config?.publicUrl||window.location.origin}/camera/${code}#${cameraToken}`;
  const lots=room?.lots||[];const lot=lots.find(l=>l.id===selectedId)||lots[0]||room?.active;const price=lot?priceAt(lot,now):0;
  const hasActive=lots.some(l=>l.status==='active');
  const turnover=room?.volume||0;
  const progress=lot?.startTime?Math.max(0,Math.min(1,(now-lot.startTime)/(lot.duration*1000))):0;
  const remaining=lot?.startTime?Math.max(0,Math.ceil(lot.duration-(now-lot.startTime)/1000)):duration;
  const frameFresh=!!live.frame&&Date.now()-live.frameAt<5000;
  const trackingSource=useRef({live,room,busy,includePeople,token});trackingSource.current={live,room,busy,includePeople,token};
  useEffect(()=>{
    if(!host||!socket)return;let cancelled=false;let timer:ReturnType<typeof setTimeout>;const memory=new Map<string,{candidate:Candidate;seen:number}>();let pass=0;
    const streaks=new Map<string,{since:number;last:number}>(),addedAt=new Map<string,number>();let replacing=false,retryAt=0;
    async function tick(){
      const state=trackingSource.current;
      if(state.room?.live){
        try{
          const canvas=document.createElement('canvas'),v=videoRef.current;
          if(v?.videoWidth&&(state.live.stream||state.live.rtcConnected)){canvas.width=960;canvas.height=Math.round(960*v.videoHeight/v.videoWidth);canvas.getContext('2d')!.drawImage(v,0,0,canvas.width,canvas.height);}
          else if(state.live.frame&&Date.now()-state.live.frameAt<4000){const image=new Image();image.src=state.live.frame;await image.decode();canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d')!.drawImage(image,0,0);}
          if(canvas.width&&canvas.height&&(v?.videoWidth||state.live.frame)){
            const {detect}=await import('@/lib/detector');const focus=++pass%2===0?(state.room.lots||[]).filter(l=>l.source==='local'||l.source==='vision').map(l=>memory.get(l.detectionLabel||l.label)?.candidate.bbox||l.bbox):[];
            const raw=await detect(canvas,false,focus),at=Date.now(),peopleMode=!!state.room.peopleOnly;
            // People-only rooms follow each person individually (person#1, person#2…) by matching positions frame to frame.
            const known=[...[...memory].filter(([,m])=>m.candidate.person).map(([label,m])=>({label,bbox:m.candidate.bbox})),...(state.room.lots||[]).filter(l=>l.person&&!memory.has(l.detectionLabel||l.label)).map(l=>({label:l.detectionLabel||l.label,bbox:l.bbox}))];
            const detected=peopleMode?matchPeople(selectPeople(raw,Infinity),known):selectCandidates(raw,state.includePeople,Infinity);
            for(const c of detected){const s=streaks.get(c.label);streaks.set(c.label,{since:s&&at-s.last<1000?s.since:at,last:at});}
            const lots=state.room.lots||[],labels=new Set(lots.map(l=>l.detectionLabel||l.label)),tracked=stabilize(memory,detected,at,state.includePeople||peopleMode);
            // Absurd materials (air, wall…) are never detected: they keep the spot where they were chosen.
            const materials=lots.filter(l=>l.source==='absurd').map(l=>({label:l.detectionLabel||l.label,confidence:1,person:false,bbox:l.bbox}));
            const candidates=[...tracked.filter(c=>labels.has(c.label)),...materials,...tracked.filter(c=>!labels.has(c.label))].slice(0,MAX_LOTS);
            if(!cancelled&&trackingSource.current.room?.live){socket!.emit('tracking',{candidates,width:canvas.width,height:canvas.height});setTrackingError('');}
            // Always MAX_LOTS lots: a lot whose object left the frame is swapped for a visible object, or an absurd material if none;
            // free slots are filled the same way, and a newly visible object takes the place of an absurd material.
            // People-only rooms never use absurd materials: a person is only ever replaced by another visible person.
            const selling=lots.some(l=>l.status==='active');
            if(!replacing&&at>=retryAt&&!state.busy&&lots.length&&!lots.some(l=>l.source==='rehearsal')&&!(selling&&state.room.mode==='chain')){
              for(const l of lots)if(!addedAt.has(l.id))addedAt.set(l.id,at);
              for(const id of addedAt.keys())if(!lots.some(l=>l.id===id))addedAt.delete(id);
              // Remote-vision labels may be invisible to the local model: only swap those once they were tracked then lost.
              const gone=lots.find(l=>(l.source==='local'||(l.source==='vision'&&streaks.has(l.detectionLabel||l.label)))&&at-Math.max(streaks.get(l.detectionLabel||l.label)?.last??0,addedAt.get(l.id)!)>GONE_AFTER);
              const fresh=detected.find(c=>!labels.has(c.label)&&at-streaks.get(c.label)!.since>=STEADY_FOR);
              const absurd=lots.find(l=>l.source==='absurd');
              const lotId=gone?gone.id:lots.length<MAX_LOTS?undefined:fresh&&absurd?absurd.id:null;
              if(lotId!==null&&(fresh||!peopleMode)){
                replacing=true;
                const candidate=fresh?.person?{...fresh,appearance:describeOutfit(canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height),fresh.bbox)}:fresh;
                void api(`/api/rooms/${code}/replace`,{lotId,candidate,image:canvas.toDataURL('image/jpeg',.8),includePeople:state.includePeople},state.token)
                  .catch(()=>{retryAt=Date.now()+3000;}).finally(()=>{replacing=false;});
              }
            }
          }
        }catch{if(!cancelled)setTrackingError('Repérage automatique indisponible. Réessayez la sélection.');}
      }
      if(!cancelled)timer=setTimeout(tick,180);
    }
    timer=setTimeout(tick,500);return()=>{cancelled=true;clearTimeout(timer);};
  },[host,socket,code]);
  async function captureDetail(){
    const canvas=document.createElement('canvas'),v=videoRef.current;
    if(!room?.live)throw new Error('Activez une caméra avant de cadrer un détail.');
    if(v?.videoWidth&&(live.stream||live.rtcConnected)){canvas.width=Math.min(1280,v.videoWidth);canvas.height=Math.round(canvas.width*v.videoHeight/v.videoWidth);canvas.getContext('2d')!.drawImage(v,0,0,canvas.width,canvas.height);}
    else if(frameFresh){const image=new Image();image.src=live.frame;await image.decode();canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d')!.drawImage(image,0,0);}
    else throw new Error('Attendez la première image.');
    setDetailImage(canvas.toDataURL('image/jpeg',.85));
  }
  async function scan(rehearsal=false){
    let image:string;let candidates;
    if(rehearsal){
      const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const ctx=canvas.getContext('2d')!;
      ctx.fillStyle='#e5e9db';ctx.fillRect(0,0,960,540);ctx.fillStyle='#b7c2a8';ctx.fillRect(0,380,960,160);
      ctx.fillStyle='#696346';ctx.fillRect(380,150,200,200);ctx.fillStyle='#424e3b';ctx.fillRect(355,330,250,35);ctx.fillRect(370,355,20,110);ctx.fillRect(570,355,20,110);
      ctx.fillStyle='#242821';ctx.font='20px sans-serif';ctx.fillText('DÉCOR DE RÉPÉTITION · IMAGE SIMULÉE',28,40);
      image=canvas.toDataURL('image/jpeg');candidates=[{label:'chair',confidence:1,person:false,bbox:[.35,.25,.3,.64]}];
    }else{
      const v=videoRef.current;const canvas=document.createElement('canvas');
      if(!room?.live)throw new Error('Activez la caméra du PC ou connectez votre téléphone caméra.');
      if(v?.videoWidth&&(live.stream||live.rtcConnected)){
        canvas.width=Math.min(v.videoWidth,960);canvas.height=canvas.width*v.videoHeight/v.videoWidth;canvas.getContext('2d')!.drawImage(v,0,0,canvas.width,canvas.height);
      }else if(frameFresh){const capture=new Image();capture.src=live.frame;await capture.decode();canvas.width=capture.width;canvas.height=capture.height;canvas.getContext('2d')!.drawImage(capture,0,0);}
      else throw new Error('La première image de la caméra arrive. Réessayez dans un instant.');
      image=canvas.toDataURL('image/jpeg',.8);
      if(!remoteVision){
        setBusy('L’IA examine la pièce…');const {detect}=await import('@/lib/detector');const found=await detect(canvas,true);
        // Each detected person gets a clothing description computed from the frame's pixels.
        const pixels=found.some(c=>c.person)?canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height):null;
        candidates=found.map(c=>c.person&&pixels?{...c,appearance:describeOutfit(pixels,c.bbox)}:c);
      }
    }
    const data=await api<{count:number}>(`/api/rooms/${code}/scan`,{image,candidates,includePeople,peopleOnly,duration,source:rehearsal?'rehearsal':remoteVision?'vision':'local'},token);
    setSelectedId('');setNotice(peopleOnly?`${data.count} personnage${data.count>1?'s':''} fictif${data.count>1?'s':''} noté${data.count>1?'s':''} sur 10. Les prix descendront ensemble au lancement.`:`${data.count} catégorie${data.count>1?'s':''} sélectionnée${data.count>1?'s':''}. Les prix descendront ensemble au lancement.`);
  }
  async function startLot(){
    if(!lot||!room)return;
    const previews=lots.filter(l=>l.status==='preview');if(!previews.length)return;
    const batchId=previews.map(l=>l.id).join(',');
    let txHash:string|undefined;
    if(room.mode==='chain'){
      if(!config?.contractAddress)throw new Error('Contrat non configuré.');
      if(pendingList.current?.lotId===batchId)txHash=pendingList.current.hash;
      else{txHash=await listOnChain(config.contractAddress,previews);pendingList.current={lotId:batchId,hash:txHash};}
      setBusy('Confirmation sur Monad…');
    }
    await api(`/api/rooms/${code}/start`,{txHash},token);pendingList.current=null;
  }
  async function buy(){
    if(!lot||!room)return;
    if(room.mode==='demo'){
      localStorage.setItem('nickname',nickname);await api(`/api/rooms/${code}/buy`,{buyer:nickname.trim()||'Collectionneur anonyme',lotId:lot.id});
    }else{
      if(!config?.contractAddress)throw new Error('Contrat non configuré.');
      const result=await buyOnChain(config.contractAddress,lot);setWallet(result.account);
      await api(`/api/rooms/${code}/refresh`,{});setNotice('Votre achat est confirmé sur Monad.');
    }
  }
  return <div className={`room-page ${scene?'scene-mode':host?'host-view':'buyer-view'}`}>
    <header className="topbar"><Brand/><div className="room-header-middle"><span className={`connection-dot ${connected?'on':''}`}/><span>{connected?'Connecté':'Connexion…'}</span><span className="header-divider"/><span className="mono">SALLE {code}</span></div><div className="header-actions"><Pill className={room?.mode==='demo'?'demo-pill':'network'}>{room?.mode==='demo'?'RÉPÉTITION · SIMULÉ':'MONAD TESTNET'}</Pill>{host&&room?.mode==='chain'&&<button className="button small-button" onClick={()=>act('Connexion au wallet…',async()=>{const c=await connectWallet();setWallet(c.account);})}><Wallet size={15}/>{wallet?shortAddress(wallet):'Wallet'}</button>}</div></header>
    <main id="contenu" className="room-main"><div className="room-title"><div><div className="eyebrow">{host?'LA RÉGIE DU CHAOS':scene?'LA SALLE DES VENTES':'EN DIRECT · À VOUS DE JOUER'}</div><h1>{room?.name||'La salle se prépare…'}</h1></div><Pill><Users size={14}/>{room?.viewers||0} dans la salle</Pill></div>
    {error&&<div className="error" role="alert">{error}<button className="icon-button" aria-label="Fermer l’erreur" onClick={()=>setError('')}><X size={16}/></button></div>}
    {!connected&&room&&<div className="warning">Connexion interrompue. Les achats sont suspendus jusqu’à la reconnexion.</div>}
    {room&&!room.chainHealthy&&<div className="warning">Monad répond lentement. Le prix affiché est indicatif ; le contrat vérifie chaque achat.</div>}
    <div className="market-strip"><div><span className="market-led"/> SALLE DES VENTES <b>{room?.live?'LIVE':'PRÊTE'}</b></div><div><span>LOTS OUVERTS</span><strong>{lots.filter(l=>l.status==='active').length.toString().padStart(2,'0')}</strong></div><div><span>{room?.mode==='demo'?'VOLUME SIMULÉ':'VOLUME · MON TEST'}</span><strong>{formatMon(turnover)} <small>MON</small></strong></div><div><span>ACQUISITIONS</span><strong>{room?.salesCount||0}</strong></div></div>
    <div className="room-grid"><section className="broadcast-column">
      <div className="video-shell"><div className="video-top"><Pill className={room?.live?'live-pill':'offline-pill'}><span className="dot"/>{room?.live?'EN DIRECT':'EN ATTENTE'}</Pill><span className="video-source">{host?(room?.videoSource==='phone'?'CAMÉRA DU TÉLÉPHONE':'CAMÉRA VENDEUR'):live.rtcConnected?'VIDÉO EN DIRECT':frameFresh?'DIRECT · DÉBIT RÉDUIT':'LE SPECTACLE VA COMMENCER'}</span></div>
      {host&&live.stream?<Video stream={live.stream} muted onReady={readyVideo}/>:live.remote&&live.rtcConnected?<Video stream={live.remote} muted={muted} onReady={host?readyVideo:undefined}/>:frameFresh?<img className="live-image" src={live.frame} alt="Images en direct du vendeur"/>:<div className="video-empty"><div className="camera-orbit"><Camera size={44} strokeWidth={1}/></div><h2>{host?'Votre pièce. Notre prochain scandale.':room?.live?'Connexion au live…':'Le vendeur prépare son bazar.'}</h2><p>{host?'Activez la caméra pour ouvrir la vente la moins sérieuse du siècle.':'La vidéo apparaîtra ici dès que le vendeur démarre.'}</p>{host&&<button className="button lime" disabled={!!busy||!connected} onClick={()=>act('Ouverture de la caméra…',()=>live.start(mic))}><Camera size={18}/> Activer la caméra</button>}</div>}
      {room?.live&&<LiveSelection frame={tracking} lots={lots} now={now} onSelect={setSelectedId}/>}
      {room?.live&&<span className="vision-status"><ScanLine size={12}/>{tracking&&now-tracking.at<4500?('VISION ACTIVE · '+tracking.candidates.length+' CATÉGORIE(S)'):'VISION · ANALYSE EN COURS'}</span>}
      <div className="video-bottom"><span><span className="record-dot"/>{room?.live?'La réalité dépasse la fiction.':'Aucun enregistrement.'}</span><div>{!host&&live.rtcConnected&&<button className="glass-button" aria-label={muted?'Activer le son':'Couper le son'} onClick={()=>setMuted(!muted)}>{muted?<VolumeX size={17}/>:<Volume2 size={17}/>}</button>}<button className="glass-button" aria-label="Plein écran" onClick={e=>void e.currentTarget.closest('.video-shell')?.requestFullscreen()}><Maximize2 size={16}/></button></div></div>
      <div className="reactions-float">{reactions.map(r=><span key={r.id}>{r.emoji}</span>)}</div></div>
      <div className="under-video"><span><Radio size={16}/> {host?'Le banal entre en bourse.':'Vous êtes aux premières loges.'}</span><div className="reaction-buttons">{['🔥','💀','🤌','🪑','💸'].map(e=><button disabled={!connected} key={e} onClick={()=>socket?.emit('reaction',e)} aria-label={`Réagir ${e}`}>{e}</button>)}</div></div>
      {host&&phonePanel&&<section className="phone-pairing"><div><span className="eyebrow">TÉLÉPHONE CAMÉRA · PC COMMISSAIRE</span><h3>Filmez depuis votre téléphone.</h3><p>Scannez ce QR avec votre téléphone, puis activez sa caméra. Gardez cette régie sur le PC pour choisir les lots et signer avec Rabby.</p><button className="copy-button" onClick={()=>act('',async()=>{await navigator.clipboard.writeText(cameraUrl);setNotice('Lien caméra copié. Il donne uniquement accès à la diffusion.');})}><Copy size={14}/> Copier le lien caméra</button><p className="small muted">Ce QR est réservé au téléphone du vendeur. Pour les acheteurs, utilisez le QR « Invitez les collectionneurs ».</p></div>{cameraToken&&<div className="qr"><QRCodeSVG value={cameraUrl} size={120} title="QR code de la caméra du téléphone"/></div>}</section>}
      {host?<div className="host-controls"><div className="control-heading"><h3><ScanLine size={18}/> L’expert entre en scène.</h3><span className="tiny-label">{config?.vision&&remoteVision?'VISION DISTANTE':'IA LOCALE · SANS CLÉ API'}</span></div><div className="control-options"><label className="check-label"><input type="checkbox" checked={peopleOnly} disabled={hasActive} onChange={e=>setPeopleOnly(e.target.checked)}/> Mode humains uniquement</label><label className="check-label"><input type="checkbox" checked={includePeople||peopleOnly} disabled={peopleOnly} onChange={e=>setIncludePeople(e.target.checked)}/> Inclure les personnages consentants</label><label className="check-label"><input type="checkbox" checked={mic} disabled={!!live.stream} onChange={e=>setMic(e.target.checked)}/> Micro du vendeur</label><label className="duration">Durée <select value={duration} onChange={e=>setDuration(Number(e.target.value))}><option value={30}>30 s</option><option value={60}>60 s</option><option value={90}>90 s</option></select></label>{config?.vision&&<label className="check-label"><input type="checkbox" checked={remoteVision} onChange={e=>setRemoteVision(e.target.checked)}/> Expertise IA distante</label>}</div><div className="control-buttons"><button className="button small-button" onClick={()=>setPhonePanel(!phonePanel)}><Camera size={16}/> Filmer avec mon téléphone</button><button className="button primary" disabled={!!busy||!room?.live||!(cameraReady||frameFresh)||!connected||hasActive} onClick={()=>act('Sélection de la prochaine victime…',()=>scan())}><Shuffle size={18}/> {peopleOnly?'Sélectionner les humains':`Sélectionner ${MAX_LOTS} objets`}</button><button className="button small-button" disabled={!!busy||!connected||!room?.live||!(cameraReady||frameFresh)||hasActive||lots.filter(l=>l.status==='preview').length>=MAX_LOTS} onClick={()=>act('Capture du détail…',captureDetail)}><ScanLine size={16}/> Cadrer un petit objet</button>{room?.videoSource==='phone'&&<button className="button small-button" onClick={()=>act('Arrêt du téléphone caméra…',async()=>{await api(`/api/rooms/${code}/close`,{},token);})}><VideoOff size={16}/> Couper le téléphone</button>}{live.stream&&<button className="button small-button" onClick={live.stop}><VideoOff size={16}/> Couper le live</button>}{room?.mode==='demo'&&<button className="button text-button small-button" disabled={!!busy||!connected||hasActive} onClick={()=>act('Préparation du décor…',()=>scan(true))}>Essayer avec un décor fictif</button>}</div><p className="muted small">{peopleOnly?`Mode humains : seules les personnes consentantes sont mises aux enchères, jusqu’à ${MAX_LOTS}, comme personnages fictifs. Chacune reçoit une note sur 10 et un prix selon sa fiche de personnage inventée, jamais selon son physique.`:includePeople?'Les personnes deviennent des cartes de personnages fictifs, avec leur accord. Aucun humain n’est vendu.':`Priorité aux petits objets · une seule cible par catégorie · toujours ${MAX_LOTS} lots, remplacés dès qu’ils quittent l’écran · s’il manque des objets, l’expert vend l’air, le mur ou le plafond.`}</p>{trackingError&&<p className="warning">{trackingError}</p>}<p className="recognition-note">La reconnaissance locale couvre 80 catégories : mouchoirs, écouteurs et miettes peuvent ne pas être reconnus. Rapprochez la caméra ou utilisez « Cadrer un petit objet » pour les ajouter.</p></div>:<div className="auctioneer"><span className="auctioneer-avatar">B.</span><div><span className="tiny-label">BALTHAZAR · EXPERT AUTOPROCLAMÉ</span><p>« {lot?.status==='sold'?'Adjugé. Une décision discutable, mais une décision historique.':lot?.status==='active'?auctioneer(progress):'Mes qualifications ? Une confiance en moi absolument déraisonnable.'} »</p></div></div>}
      <section className="history"><div className="control-heading"><h3>Le musée des mauvaises décisions</h3><span className="tiny-label">{room?.history.length||0} ACQUISITION(S)</span></div>{!room?.history.length?<p className="empty-history">Le premier chef-d’œuvre attend encore son collectionneur.</p>:room.history.slice().reverse().map(item=><div className="history-item" key={item.id}><Trophy size={19}/><div><strong>{item.name}</strong><span>{shortAddress(item.buyer||'')} · {item.title}</span></div><b>{formatMon(item.soldPrice||0)} <small>MON</small></b></div>)}</section>
    </section><aside className="auction-column">
      <section className="collection-panel"><div className="collection-heading"><div><span className="eyebrow">LA SÉLECTION PRIVÉE</span><h2>{host?"Votre sélection":"Choisissez votre objet."}</h2></div><span className="selection-count">{lots.length}/{MAX_LOTS}</span></div><p className="collection-subtitle">{hasActive?'Le prix baisse. Achetez quand vous voulez.':'Les objets se préparent. Le live continue.'}</p>
      <div className="lot-rail" aria-label="Objets sélectionnés">{lots.length?lots.map((item,i)=><button key={item.id} className={['rail-item',lot?.id===item.id?'selected':'',item.status==='sold'?'sold':''].join(' ')} onClick={()=>setSelectedId(item.id)} aria-pressed={lot?.id===item.id}><span className="rail-thumb" style={{borderColor:trackingColor(item.detectionLabel||item.label,lots)}}><LotThumbnail lot={item}/><i>{String(i+1).padStart(2,'0')}</i></span><span className="rail-copy"><span className="rail-label">{item.label}{item.rating!==undefined&&<b className="rail-rating">{item.rating}/10</b>} <span>{item.status==='sold'?'ADJUGÉ':item.status==='active'?'EN VENTE':'EN ATTENTE'}</span></span><strong>{item.name}</strong><span className="rail-price">{formatMon(priceAt(item,now))} <small>MON</small>{item.status==='active'&&<ChevronDown size={15}/>}</span></span></button>):<div className="rail-empty"><ScanLine size={25}/><p>Les trésors apparaissent ici.<br/><span>Filmez une surface et lancez la sélection.</span></p><span className="empty-slots">{Array.from({length:MAX_LOTS},(_,i)=>String(i+1).padStart(2,'0')).join(' — ')}</span></div>}</div></section>
      <section className={`lot-card ${lot?.status==='sold'?'sold-card':''}`}><div className="lot-top"><span className="eyebrow">{lot?.status==='sold'?'UN CHOIX HISTORIQUE':lot?.status==='preview'?'NOTRE PROCHAINE OBSESSION':'LE LOT DU MOMENT'}</span><span className="lot-number">#{String(Math.max(0,lots.findIndex(l=>l.id===lot?.id))+1).padStart(3,'0')}</span></div>
      {lot?<><div className="lot-photo"><LotThumbnail lot={lot}/><span className="lot-detected"><ScanLine size={12}/>{lot.label}</span></div><div className="lot-body"><span className="tiny-label">{lot.source==='manual'?'CADRAGE MANUEL · EXPERTISE FICTIVE':lot.source==='rehearsal'?'DÉCOR SIMULÉ':lot.source==='vision'?'EXPERTISE IA FANTAISISTE':'OBJET RECONNU PAR IA · EXPERTISE FICTIVE'}</span><h2>{lot.name}</h2><p className="lot-description">{lot.description}</p>{lot.appearance&&<div className="lot-appearance"><span className="tiny-label">SIGNALEMENT VESTIMENTAIRE</span><p>{lot.appearance}</p></div>}{lot.rating!==undefined&&<div className="lot-rating"><strong>{lot.rating}<small>/10</small></strong><p>{lot.ratingReason}</p></div>}<div className="traits">{lot.traits.map(t=><span key={t}>{t}</span>)}</div>
      {lot.status==='sold'?<div className="winner"><div className="winner-icon"><Trophy size={29}/></div><span className="eyebrow">ADJUGÉ À {shortAddress(lot.buyer||'').toUpperCase()}</span><h3>{lot.title}</h3><strong><Money value={lot.soldPrice||0}/></strong><p>La collection s’agrandit. Le mystère aussi.</p></div>:<><div className="price-label"><span>{lot.status==='preview'?'MISE À PRIX SCANDALEUSE':'PRIX ACTUEL'}</span><span className="countdown">{lot.status==='active'?remaining>0?`${remaining}s`:'PLANCHER':`${lot.duration}s de chute`}</span></div><div className="current-price"><Money value={price}/>{lot.status==='active'&&<ChevronDown className="price-arrow" size={32}/>}</div><div className="price-track"><span style={{width:`${(1-progress)*100}%`}}/></div><div className="price-range"><span>Départ {formatMon(lot.startPrice)}</span><span>Plancher {formatMon(lot.floorPrice)}</span></div>
      {host?<button className="button primary full buy-button" disabled={!!busy||!connected||lot.status!=='preview'} onClick={()=>act('Mise en vente…',startLot)}>{lot.status==='active'?<><Radio size={19}/> Les enchères sont ouvertes</>:<><Zap size={19}/> {lots.length>1?`Lancer les ${lots.length} enchères`:"Lancer l’enchère"}</>}</button>:scene?<div className="scene-instruction">Scannez le QR code pour acheter. ↓</div>:<>{room?.mode==='demo'&&<label className="nickname-label">Votre nom de collectionneur<input value={nickname} maxLength={24} required autoComplete="nickname" onChange={e=>setNickname(e.target.value.replace(/[<>]/g,''))}/></label>}<button className="button primary full buy-button" disabled={!!busy||!connected||lot.status!=='active'} onClick={()=>act(room?.mode==='demo'?'Adjugé ?':'Confirmez dans votre wallet…',buy)}>{lot.status==='preview'?'L’enchère va commencer':<>{room?.mode==='demo'?'Acheter · simulation':'Acheter'} <ArrowUpRight size={20}/></>}</button></>}
      <p className="buy-note">{room?.mode==='demo'?'Répétition : aucun paiement, aucune transaction blockchain.':'MON de test sans valeur. Le prix final est calculé par le contrat ; l’excédent est remboursé.'}</p></>}
      {lot.chainId!==undefined&&config?.contractAddress&&<a className="explorer-link" href={`https://testnet.monadvision.com/address/${config.contractAddress}`} target="_blank" rel="noreferrer">Lot #{lot.chainId} sur Monad <ExternalLink size={12}/></a>}</div></>:<div className="no-lot"><ScanLine size={48} strokeWidth={1}/><h2>La prochaine pépite<br/>se cache dans la pièce.</h2><p>{host?'Activez la caméra, puis lancez la sélection.':'Le vendeur prépare sa sélection. Préparez votre sang-froid.'}</p></div>}
      </section>
      <section className="share-card"><div><span className="eyebrow">PLUS ON EST, MOINS ON ATTEND.</span><h3>Invitez les collectionneurs.</h3><span className="room-code">{code}</span><button className="copy-button" onClick={()=>act('',async()=>{await navigator.clipboard.writeText(joinUrl);setCopied(true);setTimeout(()=>setCopied(false),2500);})}>{copied?<Check size={14}/>:<Copy size={14}/>} {copied?'Lien copié':'Copier le lien'}</button></div>{joinUrl&&<div className="qr"><QRCodeSVG value={joinUrl} size={92} level="M" title="QR code pour rejoindre la salle"/></div>}</section>
      {host&&<a className="scene-link" href={`/scene/${code}`} target="_blank" rel="noreferrer"><Eye size={15}/> Ouvrir la vue grand écran <MoveUpRight size={14}/></a>}
      <p className="room-disclaimer">Une vente fictive, une expertise fantaisiste. Aucun objet ni aucune personne ne sont réellement vendus. {room?.mode==='chain'?'Transactions exclusivement sur Monad Testnet.':'Cette salle utilise des achats simulés.'}</p>
    </aside></div></main>
    {!host&&!scene&&lot?.status==='active'&&<div className="mobile-buy-dock"><div><span>{lot.name}</span><strong><Money value={price}/></strong></div><button className="button primary" disabled={!!busy||!connected} onClick={()=>act(room?.mode==='demo'?'Adjugé ?':'Confirmez dans votre wallet…',buy)}>{room?.mode==='demo'?'Acheter (simulé)':'Acheter'}<ArrowUpRight size={17}/></button></div>}
    {room&&<SaleMascot history={room.history}/>}
    {detailImage&&<DetailPicker image={detailImage} busy={!!busy} onClose={()=>setDetailImage('')} onSave={candidate=>act('Ajout du détail…',async()=>{await api('/api/rooms/'+code+'/detail',{image:detailImage,candidate,duration},token);setDetailImage('');setNotice('Détail ajouté par cadrage manuel.');})}/>}
    {busy&&<div className="toast busy-toast" role="status"><LoaderCircle className="spin" size={18}/>{busy}</div>}{notice&&!busy&&<div className="toast" role="status"><Sparkles size={18}/>{notice}</div>}
  </div>;
}

function CameraPage({config,code}:{config:Config|null;code:string}){
  const [socket,setSocket]=useState<Socket|null>(null);const [room,setRoom]=useState<Room|null>(null);
  const [connected,setConnected]=useState(false);const [error,setError]=useState('');const [mic,setMic]=useState(false);const [busy,setBusy]=useState(false);
  const live=useLive(socket,true,config?.iceServers||emptyIce);const announce=useRef(live.announce);announce.current=live.announce;
  useEffect(()=>{
    if(!config)return;
    const key=`camera:${code}`;const fragment=location.hash.slice(1);
    if(/^[a-f0-9]{64}$/.test(fragment)){sessionStorage.setItem(key,fragment);history.replaceState(null,'',location.pathname);}
    const cameraToken=sessionStorage.getItem(key);if(!cameraToken){setError('Scannez le QR « Filmer avec mon téléphone » depuis la régie vendeur.');return;}
    const s=io({transports:['websocket','polling']});setSocket(s);
    s.on('connect',()=>s.emit('join',{code,cameraToken},(r:{error?:string;room:Room})=>{if(r.error){setError(r.error);return;}setRoom(r.room);setConnected(true);announce.current();}));
    s.on('room',setRoom);s.on('disconnect',()=>setConnected(false));s.on('connect_error',()=>setError('Connexion interrompue. Nouvelle tentative…'));
    return()=>{s.disconnect();setSocket(null);};
  },[code,config]);
  return <div className="room-page"><header className="topbar"><Brand/><Pill>CAMÉRA VENDEUR</Pill></header><main id="contenu" className="camera-page"><div className="eyebrow">VOTRE TÉLÉPHONE EST NOS YEUX.</div><h1>{room?.name||'Relier la caméra.'}</h1><p className="muted">La régie sur le PC choisit les lots et signe les enchères. Ici, filmez simplement la pièce.</p>{error&&<p className="error" role="alert">{error}</p>}<div className="video-shell"><div className="video-top"><Pill className={live.stream?'live-pill':'offline-pill'}><span className="dot"/>{live.stream?'EN DIRECT':'CAMÉRA ÉTEINTE'}</Pill><span className="mono">{code}</span></div>{live.stream?<Video stream={live.stream} muted/>:<div className="video-empty"><Camera size={48} strokeWidth={1}/><h2>Le bazar n’attend que vous.</h2><p>La caméra sera partagée avec la régie et les participants de cette salle.</p></div>}</div><label className="check-label camera-mic"><input type="checkbox" checked={mic} disabled={!!live.stream} onChange={e=>setMic(e.target.checked)}/> Diffuser aussi mon micro</label>{live.stream?<button className="button primary full" onClick={live.stop}><VideoOff size={18}/> Arrêter la diffusion</button>:<button className="button primary full" disabled={!connected||busy} onClick={async()=>{setBusy(true);setError('');try{await live.start(mic);}catch(e){setError(errorText(e));}finally{setBusy(false);}}}>{busy?<LoaderCircle className="spin"/>:<><Camera size={18}/> Démarrer la caméra du téléphone</>}</button>}<p className="small muted">Gardez cette page ouverte, l’écran allumé et le téléphone en paysage si possible. Aucun wallet n’est nécessaire sur ce téléphone.</p><div className="setup-status"><Radio size={20}/><div><strong>{connected?'Relié à la régie':'Connexion à la régie…'}</strong><p>{room?.viewers||0} spectateur(s) · {room?.active?.name||'La prochaine cible est peut-être derrière vous.'}</p></div></div></main></div>;
}

function Setup({config}:{config:Config|null}){
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [result,setResult]=useState<{address:string;hash:string}|null>(null);
  return <div className="landing"><header className="topbar"><Brand/><a href="/">Retour à l’accueil <ArrowRight size={16}/></a></header><main id="contenu" className="setup"><span className="eyebrow">COULISSES DU SPECTACLE</span><h1>Brancher Monad.</h1><p>La répétition fonctionne déjà sans wallet. Pour ouvrir les ventes sur le testnet, déployez le contrat depuis votre wallet dédié, avec des MON de test.</p><div className="setup-status"><ShieldCheck/><div><strong>Réseau imposé : Monad Testnet · 10143</strong><p>{config?.contractAddress?`Contrat configuré : ${config.contractAddress}`:'Aucun contrat configuré pour le moment.'}</p></div></div><p>Votre wallet conserve vos clés. Seule une transaction de déploiement vous sera demandée.</p><a href="https://faucet.monad.xyz" target="_blank" rel="noreferrer" className="explorer-link">Obtenir des MON de test <ExternalLink size={14}/></a><button className="button primary" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{setResult(await deployContract());}catch(e){setError(errorText(e));}finally{setBusy(false);}}}>{busy?<><LoaderCircle className="spin"/> Déploiement en cours…</>:<>Déployer avec mon wallet <ArrowUpRight size={18}/></>}</button>{error&&<p className="error">{error}</p>}{result&&<div className="deployment-result"><h2>Contrat déployé.</h2><p>Ajoutez cette adresse à <code>CONTRACT_ADDRESS</code> dans le fichier local <code>.env</code>, puis redémarrez le serveur.</p><code>{result.address}</code><a href={`https://testnet.monadvision.com/tx/${result.hash}`} target="_blank" rel="noreferrer">Voir le déploiement</a></div>}<p className="muted small">L’adresse et la transaction sont publiques. Ne copiez jamais votre clé privée ni votre phrase de récupération.</p></main></div>;
}
