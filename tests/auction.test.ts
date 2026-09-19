import {test} from 'node:test';
import assert from 'node:assert/strict';
import {priceAt} from '../lib/auction';
import {createRoom,makeLot,selectCandidate,sellDemo,publicRoom} from '../server/rooms';
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
  assert.ok(!('hostToken' in state));assert.ok(!('hostSocket' in state));assert.ok(!('peers' in state));
});
