import {mkdir,writeFile} from 'node:fs/promises';
const base='https://storage.googleapis.com/tfjs-models/savedmodel/ssdlite_mobilenet_v2/';
const root='public/models/coco';
await mkdir(root,{recursive:true});
const res=await fetch(base+'model.json');if(!res.ok)throw new Error(`Modèle introuvable : ${res.status}`);
const model=await res.json();
for(const group of model.weightsManifest)for(const path of group.paths){
  if(path.includes('..')||path.includes('/'))throw new Error('Chemin de poids invalide');
  const r=await fetch(base+path);if(!r.ok)throw new Error(`Poids indisponibles : ${r.status}`);
  await writeFile(`${root}/${path}`,Buffer.from(await r.arrayBuffer()));console.log(`Poids : ${path}`);
}
await writeFile(`${root}/model.json`,JSON.stringify(model));console.log('Modèle COCO-SSD disponible localement.');
