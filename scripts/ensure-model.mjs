import {existsSync} from 'node:fs';
if(!existsSync('public/models/coco/model.json'))await import('./download-model.mjs');
