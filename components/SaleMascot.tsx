'use client';
import {useEffect,useRef,useState} from 'react';
import type {Lot} from '@/lib/types';
import {formatMon,shortAddress} from '@/lib/auction';

/** A lightweight vector animation: transparent, sharp on phones, no GIF download. */
export function SaleMascot({history}:{history:Lot[]}){
  const seen=useRef<Set<string>|null>(null);const [queue,setQueue]=useState<Lot[]>([]);
  useEffect(()=>{
    if(!seen.current){seen.current=new Set(history.map(l=>l.id));return;}
    const fresh=history.filter(l=>!seen.current!.has(l.id));fresh.forEach(l=>seen.current!.add(l.id));
    if(fresh.length)setQueue(q=>[...q,...fresh]);
  },[history]);
  const current=queue[0];
  useEffect(()=>{if(!current)return;const t=setTimeout(()=>setQueue(q=>q.slice(1)),3400);return()=>clearTimeout(t);},[current]);
  if(!current)return null;
  return <div key={current.id} className="sale-celebration" role="status" aria-live="polite" data-lot={current.id}>
    <svg className="auction-puppet" viewBox="0 0 240 205" aria-hidden="true">
      <ellipse cx="125" cy="194" rx="89" ry="7" fill="#141a2630"/>
      <g className="puppet-body">
        <path d="M51 187 Q49 122 97 120 Q143 121 153 188" fill="#6246ba"/><path d="M85 126 L105 164 126 125" fill="#faf7ef"/>
        <path d="M87 137 L105 145 94 155Z M122 137 L105 145 116 155Z" fill="#e5aa46"/><circle cx="105" cy="145" r="4" fill="#c28027"/>
        <ellipse cx="105" cy="91" rx="37" ry="41" fill="#f3c69e"/><ellipse cx="66" cy="96" rx="8" ry="11" fill="#f3c69e"/>
        <path d="M71 81 Q72 52 107 53 Q134 57 141 83 L132 74 Q104 87 78 74Z" fill="#46372d"/>
        <path d="M88 82 Q94 78 99 83 M115 82 Q121 78 127 83" fill="none" stroke="#46372d" strokeWidth="3" strokeLinecap="round"/>
        <ellipse cx="95" cy="91" rx="3" ry="4" fill="#283044"/><ellipse cx="121" cy="91" rx="3" ry="4" fill="#283044"/>
        <path d="M106 90 Q124 105 107 108" fill="#e2a878"/><path d="M84 111 Q99 100 107 111 Q119 101 133 111 Q121 123 107 114 Q95 123 84 111Z" fill="#49352c"/>
        <path d="M98 119 Q109 130 121 119" fill="#fff"/><circle cx="83" cy="103" r="6" fill="#e9998966"/>
        <path d="M73 64 L78 24 Q105 14 131 24 L137 65Z" fill="#252b3f"/><path d="M75 52 L135 52 137 65 73 65Z" fill="#e6b765"/>
        <ellipse cx="105" cy="65" rx="46" ry="7" fill="#252b3f"/>
        <path d="M60 144 Q35 163 50 178 L86 180" fill="none" stroke="#6246ba" strokeWidth="19" strokeLinecap="round"/><ellipse cx="88" cy="180" rx="12" ry="8" fill="#f3c69e"/>
      </g>
      <g className="puppet-arm"><path d="M140 141 L166 132 179 112" fill="none" stroke="#6246ba" strokeWidth="17" strokeLinecap="round"/><circle cx="180" cy="110" r="10" fill="#f3c69e"/><path d="M178 119 L186 69" stroke="#946237" strokeWidth="9" strokeLinecap="round"/><g transform="rotate(12 188 68)"><rect x="165" y="56" width="47" height="23" rx="5" fill="#ba8244"/><path d="M173 57V78 M203 57V78" stroke="#efca85" strokeWidth="4"/></g></g>
      <rect x="151" y="179" width="65" height="9" rx="4" fill="#86562f"/><ellipse cx="184" cy="179" rx="30" ry="7" fill="#c49151"/>
      <g className="hammer-impact" stroke="#f5b940" strokeWidth="4" strokeLinecap="round"><path d="M155 162 L145 151 M184 156V141 M208 162 L220 151"/></g>
    </svg>
    <div className="sale-announcement"><span>ADJUGÉ !</span><strong>{current.name}</strong><small>{formatMon(current.soldPrice||0)} MON · {shortAddress(current.buyer||'')}</small></div>
  </div>;
}
