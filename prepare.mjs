import {mkdir,readFile,writeFile} from 'node:fs/promises';
await mkdir('netlify/functions',{recursive:true});
await writeFile('netlify/functions/api.mjs',(await readFile('recovery-function.txt','utf8'))+'\n'+(await readFile('withdrawal-backend.txt','utf8')));
