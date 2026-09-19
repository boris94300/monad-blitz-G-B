import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const files=execFileSync('git',['diff','--cached','--name-only','--diff-filter=ACM'],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean);
const suspicious=/(?:sk-[a-zA-Z0-9_-]{25,}|gh[pousr]_[a-zA-Z0-9]{25,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/;
const bad=[];
for(const file of files){
  if(/(^|\/)\.env(\.|$)/.test(file)&&!file.endsWith('.env.example'))bad.push(file);
  const text=readFileSync(file,'utf8');if(suspicious.test(text))bad.push(file);
}
if(bad.length){console.error('Vérification requise :',Array.from(new Set(bad)).join(', '));process.exit(1);}
console.log(`${files.length} fichiers examinés : aucun secret reconnaissable ni fichier d’environnement privé.`);
