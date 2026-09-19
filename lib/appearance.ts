import type {Candidate} from './types';
type Pixels={data:ArrayLike<number>;width:number;height:number};

/** French name of a clothing colour. */
export function colorName(r:number,g:number,b:number):string{
  const R=r/255,G=g/255,B=b/255,max=Math.max(R,G,B),min=Math.min(R,G,B),d=max-min,l=(max+min)/2;
  const s=d===0?0:d/(1-Math.abs(2*l-1));
  if(l<.16)return 'noir';
  if(s<.15||d<.08)return l>.85?'blanc':l>.6?'gris clair':l>.35?'gris':'gris anthracite';
  const h=((max===R?((G-B)/d)%6:max===G?(B-R)/d+2:(R-G)/d+4)*60+360)%360;
  if(h<15||h>=345)return l<.3?'bordeaux':l>.75?'rose pâle':'rouge';
  if(h<40)return l<.45?'marron':l>.7&&s<.5?'beige':'orange';
  if(h<65)return l<.35?'kaki':l>.75&&s<.6?'beige':'jaune';
  if(h<160)return l<.3?'vert foncé':'vert';
  if(h<195)return 'turquoise';
  if(h<250)return l<.3?'bleu marine':l>.7?'bleu ciel':'bleu';
  if(h<290)return 'violet';
  return l>.7?'rose':'fuchsia';
}

/** Most frequent colour name over a 20×20 sample grid of the region. */
function dominant(p:Pixels,[x,y,w,h]:Candidate['bbox']):string{
  const counts=new Map<string,number>();
  for(let i=0;i<20;i++)for(let j=0;j<20;j++){
    const px=Math.max(0,Math.min(p.width-1,Math.floor((x+w*(i+.5)/20)*p.width)));
    const py=Math.max(0,Math.min(p.height-1,Math.floor((y+h*(j+.5)/20)*p.height)));
    const k=(py*p.width+px)*4,name=colorName(p.data[k],p.data[k+1],p.data[k+2]);
    counts.set(name,(counts.get(name)||0)+1);
  }
  return [...counts].sort((a,b)=>b[1]-a[1])[0][0];
}

/**
 * Neutral clothing description of a detected person, so buyers can tell who is who:
 * dominant colours of the top and bottom garments and the position in the frame.
 * Deliberately never describes the body, face, skin, hair, height or any other physical trait.
 */
export function describeOutfit(p:Pixels,[x,y,w,h]:Candidate['bbox']):string{
  const top=dominant(p,[x+w*.25,y+h*.22,w*.5,h*.3]);
  // Legs are only reliable when the box shows a standing silhouette.
  const bottom=h/w>1.6?dominant(p,[x+w*.3,y+h*.62,w*.4,h*.28]):null;
  const center=x+w/2,where=center<.36?'à gauche':center>.64?'à droite':'au centre';
  const outfit=!bottom?`Haut ${top}`:bottom===top?`Haut et bas ${top}`:`Haut ${top}, bas ${bottom}`;
  return `${outfit} · repéré ${where} de l’image.`;
}
