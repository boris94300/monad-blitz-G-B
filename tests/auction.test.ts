import {test} from 'node:test';
import assert from 'node:assert/strict';
import {priceAt} from '../lib/auction';
import {createRoom,makeLot,selectCandidate,sellDemo,publicRoom,replaceLot,absurdCandidates,characterSheet,ratingPrice,distinctNames} from '../server/rooms';
import {selectCandidates,selectPeople} from '../lib/selection';
test('selection prioritizes objects over tables, deduplicates classes and caps at seven',()=>{
  const candidate=(label:string,area=.1,confidence=.9)=>({label,confidence,person:label==='person',bbox:[0,0,area,area] as [number,number,number,number]});
  const selection=selectCandidates([candidate('dining table',.9,.99),candidate('cup'),candidate('cup',.3),candidate('bottle'),candidate('banana'),candidate('book'),candidate('mouse'),candidate('cell phone'),candidate('clock'),candidate('keyboard'),candidate('person')],false);
  assert.equal(selection.length,7);assert.equal(new Set(selection.map(c=>c.label)).size,7);
  assert.ok(!selection.some(c=>['dining table','person'].includes(c.label)));
  assert.equal(selectCandidates([candidate('dining table')],false)[0].label,'dining table');
  assert.equal(selectCandidates([candidate('person')],true)[0].label,'person');
  assert.equal(selectCandidates([{...candidate('person'),person:false}],false).length,0);
});
test('parallel lots sell independently and preserve their own prices and winners',()=>{
  const room=createRoom('Parallel','demo');
  room.lots=['cup','bottle','book'].map(label=>makeLot({label,person:false,confidence:1,bbox:[0,0,.1,.1]},'','demo'));
  room.active=room.lots[0];room.lots.forEach(l=>{l.status='active';l.startTime=Date.now()-2000;});
  sellDemo(room,'Alice',room.lots[1].id);sellDemo(room,'Bob',room.lots[2].id);
  assert.equal(room.lots[0].status,'active');assert.equal(room.lots[1].buyer,'Alice');assert.equal(room.lots[2].buyer,'Bob');
  assert.throws(()=>sellDemo(room,'Late',room.lots[1].id),/plus disponible/);assert.equal(room.history.length,2);
});
test('a lot that leaves the camera is swapped in place; demo newcomers join the running sale',()=>{
  const seen=(label:string)=>({label,person:false,confidence:.9,bbox:[0,0,.1,.1] as [number,number,number,number]});
  const room=createRoom('Swap','demo');
  assert.throws(()=>replaceLot(room,undefined,seen('cup'),''),/sélection/);
  room.lots=['cup','bottle','book'].map(label=>makeLot(seen(label),'','demo'));room.active=room.lots[0];
  const [cup,bottle]=room.lots;
  const fresh=replaceLot(room,bottle.id,seen('banana'),'');
  assert.equal(room.lots[1],fresh);assert.equal(fresh.status,'preview');assert.ok(!room.lots.includes(bottle));
  assert.throws(()=>replaceLot(room,bottle.id,seen('mouse'),''),/changé/);
  assert.throws(()=>replaceLot(room,cup.id,seen('book'),''),/déjà présente/);
  room.lots.forEach(l=>{l.status='active';l.startTime=Date.now()-5000;});
  const added=replaceLot(room,undefined,seen('mouse'),'');
  assert.equal(room.lots.length,4);assert.equal(added.status,'active');assert.ok(added.startTime>cup.startTime);
  for(const label of ['clock','keyboard','scissors'])replaceLot(room,undefined,seen(label),'');
  assert.throws(()=>replaceLot(room,undefined,seen('spoon'),''),/complète/);
  const chain=createRoom('Chain','chain');chain.lots=[makeLot(seen('cup'),'','chain')];chain.lots[0].status='active';
  assert.throws(()=>replaceLot(chain,chain.lots[0].id,seen('bottle'),''),/Monad/);
});
test('missing objects are completed by distinct absurd materials placed away from real objects',()=>{
  let seed=7;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const cup={label:'cup',bbox:[.4,.4,.2,.2] as [number,number,number,number]};
  const fillers=absurdCandidates([cup],6,random);
  assert.equal(fillers.length,6);assert.equal(new Set(fillers.map(f=>f.label)).size,6);assert.ok(!fillers.some(f=>f.label==='cup'||f.person));
  for(const {bbox:[x,y,w,h]} of fillers){assert.ok(x>=0&&y>=0&&x+w<=1+1e-9&&y+h<=1+1e-9);assert.ok(x+w<=.4||x>=.6||y+h<=.4||y>=.6,'filler overlaps the cup');}
  assert.equal(absurdCandidates(fillers.map(f=>({label:f.label,bbox:f.bbox})),0).length,0);
  const room=createRoom('Absurde','demo');
  room.lots=[makeLot({...cup,person:false,confidence:1},'','demo'),...fillers.map(f=>makeLot(f,'','demo','absurd'))];
  const lost=replaceLot(room,room.lots[0].id,undefined,'');
  assert.equal(lost.source,'absurd');assert.equal(room.lots.length,7);assert.equal(new Set(room.lots.map(l=>l.detectionLabel)).size,7);
  const real=replaceLot(room,room.lots[3].id,{label:'bottle',confidence:.9,person:false,bbox:[.1,.1,.1,.1]},'');
  assert.equal(real.source,'local');assert.equal(room.lots[3],real);
});
test('people-only mode keeps every distinct person, rates fictional characters and prices them by score',()=>{
  const box=(x:number):[number,number,number,number]=>[x,.2,.15,.6];
  const people=selectPeople([{label:'person',person:true,confidence:.9,bbox:box(.1)},{label:'person',person:true,confidence:.8,bbox:[.11,.21,.14,.58]},{label:'person',person:true,confidence:.7,bbox:box(.6)},{label:'cup',person:false,confidence:.99,bbox:box(.4)}]);
  assert.deepEqual(people.map(p=>p.label),['person#1','person#2']);assert.ok(people.every(p=>p.person));
  const sheet=characterSheet();assert.ok(sheet.rating>=1&&sheet.rating<=10);assert.equal(sheet.traits.length,3);assert.ok(sheet.traits.every(t=>t.endsWith("/10")));
  assert.match(sheet.ratingReason,sheet.rating<=5 ? new RegExp("moins cher") : new RegExp("Cote élevée"));
  assert.match(characterSheet(()=>0).ratingReason,/moins cher/);
  assert.ok(ratingPrice('demo',9)>ratingPrice('demo',3));assert.ok(ratingPrice('chain',10)<=.04&&ratingPrice('chain',1)>0);
  const lot=makeLot(people[0],'','demo');assert.equal(lot.person,true);assert.equal(lot.estimatedPrice,ratingPrice('demo',lot.rating!));assert.ok(lot.ratingReason);
  const room=createRoom('Humains','demo');room.peopleOnly=true;room.lots=people.map(p=>makeLot(p,'','demo'));
  assert.throws(()=>replaceLot(room,room.lots[0].id,undefined,''),/humains/);
  assert.throws(()=>replaceLot(room,room.lots[0].id,{label:'cup',person:false,confidence:.9,bbox:box(.4)},''),/humains/);
  assert.equal(replaceLot(room,room.lots[0].id,{label:'person#3',person:true,confidence:.9,bbox:box(.3)},'').detectionLabel,'person#3');
  room.lots.forEach(l=>{l.name='Icône du stand-up';});distinctNames(room.lots);assert.deepEqual(room.lots.map(l=>l.name),['Icône du stand-up','Icône du stand-up II']);
});
test('price curve starts at 10, is 4 at halfway, reaches floor and freezes when sold',()=>{
  const lot={startPrice:10,floorPrice:2,duration:60,startTime:1000};
  assert.equal(priceAt(lot,1000),10);assert.equal(priceAt(lot,31000),4);
  assert.equal(priceAt(lot,61000),2);assert.equal(priceAt(lot,1e9),2);
  assert.equal(priceAt({...lot,status:'sold',soldPrice:7},1e9),7);
});
test('people are excluded unless explicitly included',()=>{
  const person={label:'person',person:true,confidence:.99,bbox:[0,0,.5,.5] as [number,number,number,number]};
  assert.throws(()=>selectCandidate([person],false),/Aucune cible/);
  assert.equal(selectCandidate([person],true),person);
  assert.throws(()=>selectCandidate([{...person,confidence:.1}],true),/Aucune cible/);
});
test('demo sale is atomic: two competing buyers cannot both win',()=>{
  const room=createRoom('Test','demo');room.active=makeLot({label:'chair',person:false,confidence:1,bbox:[0,0,1,1]},'','demo');
  room.active.status='active';room.active.startTime=Date.now();
  sellDemo(room,'Alice');assert.throws(()=>sellDemo(room,'Bob'),/plus disponible/);
  assert.equal(room.active.buyer,'Alice');assert.equal(room.history.length,1);
});
test('demo endpoint cannot sell a blockchain lot',()=>{
  const room=createRoom('Test','chain');assert.throws(()=>sellDemo(room,'Alice'),/Monad/);
});
test('public state never includes host secret or peers',()=>{
  const room=createRoom('Test','demo');const state=publicRoom(room);
  assert.ok(!('hostToken' in state));assert.ok(!('cameraToken' in state));assert.ok(!('hostSocket' in state));assert.ok(!('peers' in state));
});

import {stabilize,trackingColor,matchPeople} from '../lib/tracking';
test('tracking bridges brief missed detections, smooths motion, then clears stale boxes',()=>{
  const memory=new Map();const c={label:'cup',person:false,confidence:.9,bbox:[.1,.1,.2,.2] as [number,number,number,number]};
  stabilize(memory,[c],1000,false);assert.equal(stabilize(memory,[],1400,false).length,1);
  const moved=stabilize(memory,[{...c,bbox:[.2,.1,.2,.2]}],1500,false);assert.ok(moved[0].bbox[0]>.1&&moved[0].bbox[0]<.2);
  assert.equal(stabilize(memory,[],2600,false).length,0);
  assert.notEqual(trackingColor('cup',[{label:'cup'},{label:'bottle'}]),trackingColor('bottle',[{label:'cup'},{label:'bottle'}]));
});
test('people keep their label while they move, and newcomers get a fresh one',()=>{
  const person=(x:number)=>({label:'person',person:true,confidence:.9,bbox:[x,.2,.1,.5] as [number,number,number,number]});
  const known=[{label:'person#1',bbox:[.1,.2,.1,.5] as [number,number,number,number]},{label:'person#2',bbox:[.6,.2,.1,.5] as [number,number,number,number]}];
  assert.deepEqual(matchPeople([person(.62),person(.13),person(.35)],known).map(p=>p.label),['person#2','person#1','person#3']);
});
import {colorName,describeOutfit} from '../lib/appearance';
test('outfit description names clothing colours and position, and nothing physical',()=>{
  assert.equal(colorName(10,10,12),'noir');assert.equal(colorName(245,245,245),'blanc');assert.equal(colorName(128,128,128),'gris');
  assert.equal(colorName(200,30,30),'rouge');assert.equal(colorName(30,60,200),'bleu');assert.equal(colorName(20,30,80),'bleu marine');
  assert.equal(colorName(40,160,60),'vert');assert.equal(colorName(110,70,30),'marron');assert.equal(colorName(230,210,60),'jaune');
  // 100×100 frame: a person standing on the left, red top over blue trousers, on a grey background.
  const width=100,height=100,data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const k=(y*width+x)*4,inside=x>=10&&x<30;const [r,g,b]=inside&&y>=20&&y<55?[200,30,30]:inside&&y>=55&&y<100?[30,60,200]:[128,128,128];
    data[k]=r;data[k+1]=g;data[k+2]=b;data[k+3]=255;
  }
  const text=describeOutfit({data,width,height},[.1,.1,.2,.9]);
  assert.equal(text,'Haut rouge, bas bleu · repéré à gauche de l’image.');
  assert.doesNotMatch(text,/cheveu|visage|peau|taille|poids|âge/);
  assert.equal(describeOutfit({data,width,height},[.1,.2,.2,.3]),'Haut rouge · repéré à gauche de l’image.');
});
