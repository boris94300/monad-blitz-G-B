'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {Socket} from 'socket.io-client';

export function useLive(socket:Socket|null,host:boolean,iceServers:RTCIceServer[]) {
  const [stream,setStream]=useState<MediaStream|null>(null);
  const [remote,setRemote]=useState<MediaStream|null>(null);
  const [frame,setFrame]=useState('');
  const [frameAt,setFrameAt]=useState(0);
  const [rtcConnected,setRtcConnected]=useState(false);
  const direct=useRef(false);
  const local=useRef<MediaStream|null>(null);
  const peers=useRef(new Map<string,RTCPeerConnection>());
  const pending=useRef(new Map<string,RTCIceCandidateInit[]>());
  const stop=useCallback(()=>{
    local.current?.getTracks().forEach(t=>t.stop());local.current=null;setStream(null);
    peers.current.forEach(p=>p.close());peers.current.clear();socket?.emit('live',false);
  },[socket]);
  const start=useCallback(async(audio:boolean)=>{
    if(!window.isSecureContext)throw new Error('La caméra nécessite une adresse HTTPS. Ouvrez le lien sécurisé de la salle.');
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Caméra indisponible dans ce navigateur. Essayez Chrome ou Safari.');
    const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:960},height:{ideal:540},frameRate:{ideal:30,max:30}},audio});
    local.current?.getTracks().forEach(t=>t.stop());local.current=next;setStream(next);socket?.emit('live',true);
  },[socket]);
  useEffect(()=>{
    if(!socket)return;
    const makePeer=(id:string)=>{
      peers.current.get(id)?.close();
      const pc=new RTCPeerConnection({iceServers});peers.current.set(id,pc);
      pc.onicecandidate=e=>{if(e.candidate)socket.emit('signal',{to:id,payload:{candidate:e.candidate.toJSON()}});};
      pc.ontrack=e=>{lastDecoded=-1;lastProgress=Date.now();setRemote(e.streams[0]||new MediaStream([e.track]));};
      pc.onconnectionstatechange=()=>{
        if(!local.current){direct.current=pc.connectionState==='connected';setRtcConnected(direct.current);}
        if(pc.connectionState==='failed'){
          pc.close();peers.current.delete(id);
          if(local.current)setTimeout(()=>void onViewer(id),1200);else socket.emit('request-live');
        }
      };
      if(host&&local.current)local.current.getTracks().forEach(t=>{
        const sender=pc.addTrack(t,local.current!);
        if(t.kind==='video'){
          t.contentHint='motion';
          const params=sender.getParameters();params.encodings=[{maxBitrate:Math.max(350000,Math.floor(3000000/Math.max(3,peers.current.size))),maxFramerate:30}];
          params.degradationPreference='maintain-framerate';void sender.setParameters(params).catch(()=>{});
        }
      });
      return pc;
    };
    const onViewer=async(id:string)=>{
      if(!host||!local.current)return;
      try{const pc=makePeer(id);await pc.setLocalDescription(await pc.createOffer());socket.emit('signal',{to:id,payload:{description:pc.localDescription}});}catch{}
    };
    const onSignal=async({from,payload}:{from:string;payload:{description?:RTCSessionDescriptionInit;candidate?:RTCIceCandidateInit}})=>{
      try{
        let pc=peers.current.get(from);
        if(payload.description?.type==='offer')pc=makePeer(from);
        if(payload.candidate) {
          if(pc?.remoteDescription)await pc.addIceCandidate(payload.candidate);
          else pending.current.set(from,[...(pending.current.get(from)||[]),payload.candidate]);
        }
        if(pc&&payload.description){
          await pc.setRemoteDescription(payload.description);
          for(const c of pending.current.get(from)||[])await pc.addIceCandidate(c);pending.current.delete(from);
          if(payload.description.type==='offer'){await pc.setLocalDescription(await pc.createAnswer());socket.emit('signal',{to:from,payload:{description:pc.localDescription}});}
        }
      }catch{direct.current=false;setRtcConnected(false);}
    };
    const onFrame=(data:{image:string;at:number})=>{if(direct.current)return;setFrame(data.image);setFrameAt(Date.now());};
    const clearRemote=()=>{peers.current.forEach(p=>p.close());peers.current.clear();pending.current.clear();direct.current=false;setRtcConnected(false);setRemote(null);setFrame('');};
    const onLeft=(id:string)=>{peers.current.get(id)?.close();peers.current.delete(id);};
    const onDisconnect=()=>{clearRemote();};
    let lastDecoded=-1,lastProgress=Date.now(),lastRetry=0;
    const health=setInterval(async()=>{
      if(local.current||!socket.connected)return;
      for(const pc of peers.current.values()){
        try{
          const stats=await pc.getStats();let decoded=-1;
          stats.forEach(stat=>{if(stat.type==='inbound-rtp'&&(stat.kind==='video'||stat.mediaType==='video'))decoded=stat.framesDecoded??-1;});
          if(decoded>lastDecoded){lastDecoded=decoded;lastProgress=Date.now();if(!direct.current&&pc.connectionState==='connected'){direct.current=true;setRtcConnected(true);}}
          if(Date.now()-lastProgress>4000){direct.current=false;setRtcConnected(false);if(Date.now()-lastRetry>8000){lastRetry=Date.now();socket.emit('request-live');}}
        }catch{}
      }
    },1500);
    socket.on('viewer',onViewer).on('signal',onSignal).on('frame',onFrame).on('live-ended',clearRemote).on('viewer-left',onLeft).on('stop-live',stop).on('disconnect',onDisconnect);
    return()=>{clearInterval(health);socket.off('viewer',onViewer).off('signal',onSignal).off('frame',onFrame).off('live-ended',clearRemote).off('viewer-left',onLeft).off('stop-live',stop).off('disconnect',onDisconnect);clearRemote();};
  },[socket,host,iceServers,stop]);
  useEffect(()=>{
    if(!socket||!stream||!host)return;
    const video=document.createElement('video');video.srcObject=stream;video.muted=true;video.playsInline=true;void video.play().catch(()=>{});
    const canvas=document.createElement('canvas');canvas.width=480;canvas.height=270;
    const timer=setInterval(()=>{
      if(!video.videoWidth||!socket.connected)return;
      canvas.height=Math.round(480*video.videoHeight/video.videoWidth);
      canvas.getContext('2d')?.drawImage(video,0,0,canvas.width,canvas.height);
      socket.volatile.emit('frame',canvas.toDataURL('image/jpeg',.45));
    },83);
    return()=>{clearInterval(timer);video.pause();video.srcObject=null;};
  },[socket,stream,host]);
  useEffect(()=>()=>{local.current?.getTracks().forEach(t=>t.stop());},[]);
  const announce=useCallback(()=>{if(local.current)socket?.emit('live',true);},[socket]);
  return {stream,remote,frame,frameAt,rtcConnected,start,stop,announce};
}
