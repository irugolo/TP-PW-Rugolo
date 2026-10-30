// Read secrets from an already private env file; output counts only, never values.
import {readFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {parseEnv} from 'node:util';
const filename=process.env.PRIVATE_ENV_FILE;
if(!filename)throw Error('Provide PRIVATE_ENV_FILE locally; never pass secret values as arguments.');
const values=Object.entries(parseEnv(await readFile(filename,'utf8'))).filter(([k,v])=>!k.startsWith('NEXT_PUBLIC_')&&/SECRET|TOKEN|SERVICE_ROLE|PASSWORD/.test(k)&&v.length>=12).map(([,v])=>v);
if(process.env.SCAN_PREVIEW_SERVICE_KEY==='true'){
 const keys=JSON.parse(execFileSync('npx',['supabase','projects','api-keys','--project-ref','kulvagylilutnpckpiuw','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
 values.push(keys.find(k=>k.name==='service_role').api_key);
}
if(!values.length)throw Error('No secret values loaded; scan would not be meaningful.');
const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
async function walk(path){const result=[];for(const e of await readdir(path,{withFileTypes:true})){const p=path+'/'+e.name;if(e.isDirectory())result.push(...await walk(p));else result.push(p);}return result;}
const files=[...tracked,...await walk('.next/static'),...(process.env.SCAN_HTML_FILE?[process.env.SCAN_HTML_FILE]:[])];let hits=0;
for(const f of files){const data=await readFile(f);if(values.some(v=>data.includes(Buffer.from(v))))hits++;}
console.log(`Scanned ${files.length} tracked/client artifact files against ${values.length} private values: ${hits} matching files.`);
if(hits)process.exitCode=1;
