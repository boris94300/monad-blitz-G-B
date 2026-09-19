import {test} from 'node:test';
import assert from 'node:assert/strict';
import {priceAt} from '../lib/auction';
import {createRoom,makeLot,selectCandidate,sellDemo,publicRoom} from '../server/rooms';
import {selectCandidates} from '../lib/selection';
test('selection prioritizes objects over tables, deduplicates classes and caps at five',()=>{
  const candidate=(label:string,area=.1,confidence=.9)=>({label,confidence,person:label==='person',bbox:[0,0,area,area] as [number,number,number,number]});
  const selection=selectCandidates([candidate('dining table',.9,.99),candidate('cup'),candidate('cup',.3),candidate('bottle'),candidate('banana'),candidate('book'),candidate('mouse'),candidate('cell phone'),candidate('person')],false);
  assert.equal(selection.length,5);assert.equal(new Set(selection.map(c=>c.label)).size,5);
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

import {stabilize,trackingColor} from '../lib/tracking';
test('tracking bridges brief missed detections, smooths motion, then clears stale boxes',()=>{
  const memory=new Map();const c={label:'cup',person:false,confidence:.9,bbox:[.1,.1,.2,.2] as [number,number,number,number]};
  stabilize(memory,[c],1000,false);assert.equal(stabilize(memory,[],1400,false).length,1);
  const moved=stabilize(memory,[{...c,bbox:[.2,.1,.2,.2]}],1500,false);assert.ok(moved[0].bbox[0]>.1&&moved[0].bbox[0]<.2);
  assert.equal(stabilize(memory,[],2600,false).length,0);
  assert.notEqual(trackingColor('cup',[{label:'cup'},{label:'bottle'}]),trackingColor('bottle',[{label:'cup'},{label:'bottle'}]));
});
