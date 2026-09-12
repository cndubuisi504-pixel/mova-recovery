import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('netlify/functions',{recursive:true});
await copyFile('recovery-function.txt','netlify/functions/api.mjs');
