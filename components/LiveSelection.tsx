'use client';
import {useEffect,useRef,useState} from 'react';
import type {Lot,TrackingFrame} from '@/lib/types';
import {trackingColor} from '@/lib/tracking';
import {priceAt,formatMon} from '@/lib/auction';

export function LotThumbnail({lot}:{lot:Lot}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    let cancelled=false;const image=new Image();image.onload=()=>{
      if(cancelled||!ref.current)return;const canvas=ref.current,ctx=canvas.getContext('2d')!;
      const [x,y,w,h]=lot.bbox;const sw=Math.min(w,1-x)*image.width,sh=Math.min(h,1-y)*image.height;
      canvas.width=240;canvas.height=200;ctx.fillStyle='#181916';ctx.fillRect(0,0,240,200);
      const scale=Math.min(240/sw,200/sh);ctx.drawImage(image,x*image.width,y*image.height,sw,sh,(240-sw*scale)/2,(200-sh*scale)/2,sw*scale,sh*scale);
    };image.src=lot.image;return()=>{cancelled=true;};
  },[lot.image,lot.bbox]);
  return <canvas ref={ref} className="object-crop" role="img" aria-label={`Détail de ${lot.label}`}/>;
}

export function LiveSelection({frame,lots,now,onSelect}:{frame:TrackingFrame|null;lots:Lot[];now:number;onSelect?:(id:string)=>void}){
  const ref=useRef<HTMLDivElement>(null);const [size,setSize]=useState({w:0,h:0});
  useEffect(()=>{const el=ref.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setSize({w:entry.contentRect.width,h:entry.contentRect.height}));observer.observe(el);return()=>observer.disconnect();},[]);
  const fresh=frame&&now-frame.at<4500;
  const scale=frame?Math.min(size.w/frame.width,size.h/frame.height):0;
  const w=(frame?.width||0)*scale,h=(frame?.height||0)*scale;
  return <div ref={ref} className="recognition-overlay" aria-label="Repérage des objets en direct">
    {fresh&&<div className="recognition-plane" style={{width:w,height:h,left:(size.w-w)/2,top:(size.h-h)/2}}>{frame.candidates.map((c,i)=>{
      const lot=lots.find(l=>(l.detectionLabel||l.label)===c.label);
      return <button key={c.label} className={`recognition-box ${lot?.status==='sold'?'is-sold':''}`} disabled={!lot||!onSelect} onClick={()=>lot&&onSelect?.(lot.id)} aria-label={`Repérer ${lot?.label||c.label}`} style={{'--target-color':trackingColor(c.label,lots),left:`${c.bbox[0]*100}%`,top:`${c.bbox[1]*100}%`,width:`${Math.min(c.bbox[2],1-c.bbox[0])*100}%`,height:`${Math.min(c.bbox[3],1-c.bbox[1])*100}%`} as React.CSSProperties}><span className="recognition-label"><b>{String((lot?lots.indexOf(lot):i)+1).padStart(2,'0')}</b> {lot?.label||c.label}{lot&&<em>{lot.status==='sold'?'ADJUGÉ':`${formatMon(priceAt(lot,now))} MON`}</em>}</span><span className="recognition-confidence">{Math.round(c.confidence*100)} %</span></button>;
    })}</div>}
  </div>;
}
