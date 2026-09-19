import {test,expect} from '@playwright/test';
import {io} from 'socket.io-client';
test('live boxes align with the video, are shared with viewers and expire when stale',async({page,request,baseURL})=>{
  const {room,hostToken}=await(await request.post('/api/rooms',{data:{name:'Repérage en direct',mode:'demo'}})).json();
  const socket=io(baseURL!,{transports:['websocket']});
  try{
    await new Promise<void>((resolve,reject)=>{socket.on('connect',()=>socket.emit('join',{code:room.code,hostToken},(r:{error?:string})=>r.error?reject(Error(r.error)):resolve()));socket.on('connect_error',reject);});
    socket.emit('live',true);await page.goto(`/join/${room.code}`);
    await expect(page.getByText('EN DIRECT',{exact:true})).toBeVisible();
    const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=800;c.height=600;const ctx=c.getContext('2d')!;ctx.fillStyle='#433e30';ctx.fillRect(0,0,800,600);ctx.fillStyle='#d9bd82';ctx.fillRect(200,150,200,200);return c.toDataURL('image/jpeg');});
    socket.emit('frame',image);
    const frame={width:800,height:600,candidates:[{label:'cup',confidence:.95,person:false,bbox:[.25,.25,.25,1/3]},{label:'bottle',confidence:.96,person:false,bbox:[.65,.25,.15,.4]}]};
    socket.emit('tracking',frame);
    const boxes=page.locator('.recognition-box');await expect(boxes).toHaveCount(2);const box=boxes.first();await expect(box).toBeVisible();
    const colors=await boxes.evaluateAll(elements=>elements.map(e=>getComputedStyle(e).borderTopColor));expect(colors[0]).not.toBe(colors[1]);
    const plane=await page.locator('.recognition-plane').boundingBox(),b=await box.boundingBox();
    expect(Math.abs(b!.x-(plane!.x+plane!.width*.25))).toBeLessThan(2);
    expect(Math.abs(b!.y-(plane!.y+plane!.height*.25))).toBeLessThan(2);
    await page.screenshot({path:'test-results/luxury-live-tracking.png'});
    await expect(boxes).toHaveCount(0,{timeout:8000});
    socket.emit('live',false);
  }finally{socket.disconnect();}
});

test('manual crop supports a tiny object without pretending it was recognized',async({browser,request})=>{
  const {room,hostToken}=await(await request.post('/api/rooms',{data:{name:'Le dernier cookie',mode:'demo'}})).json();
  const context=await browser.newContext({permissions:['camera']});await context.addInitScript(({code,token})=>localStorage.setItem(`host:${code}`,token),{code:room.code,token:hostToken});
  const page=await context.newPage();await page.goto(`/host/${room.code}`);await page.getByRole('button',{name:'Activer la caméra'}).click();
  await page.getByRole('button',{name:'Cadrer un petit objet'}).click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Nom de l’objet').fill('miette de cookie');await page.getByRole('button',{name:'Ajouter ce détail à la sélection'}).click();
  await expect(page.getByText('CADRAGE MANUEL · EXPERTISE FICTIVE',{exact:true})).toBeVisible();
  const state=await(await request.get(`/api/rooms/${room.code}`)).json();expect(state.lots[0].source).toBe('manual');expect(state.lots[0].label).toBe('miette de cookie');
  await context.close();
});
