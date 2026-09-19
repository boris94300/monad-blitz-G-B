import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const local=resolve('.tools',process.platform==='win32'?'forge.exe':'forge');
const exe=existsSync(local)?local:'forge';
const result=spawnSync(exe,['test','--root','contracts','-vv'],{stdio:'inherit'});
if(result.error)console.error('Foundry est requis : https://getfoundry.sh/introduction/installation/');
process.exit(result.status??1);
