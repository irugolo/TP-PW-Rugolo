// Published Preview read/denial checks. Native Vercel access, no personal sessions.
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {execFileSync} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const origin='https://tp-pw-rugolo-e4e6-programacion-web.vercel.app';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(url!=='https://kulvagylilutnpckpiuw.supabase.co')throw Error('Solo Preview autorizado.');
const keys=JSON.parse(execFileSync('npx',['supabase','projects','api-keys','--project-ref','kulvagylilutnpckpiuw','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const admin=createClient(url,keys.find(x=>x.name==='service_role').api_key,{auth:{persistSession:false,autoRefreshToken:false}});
let user,db,directory;
try{
 const email=`qa-${randomUUID()}@example.invalid`,password=randomUUID()+'Aa9!';
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null);user=created.data.user;
 const cookies=new Map();db=createServerClient(url,key,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:items=>items.forEach(({name,value})=>cookies.set(name,value))}});
 assert.equal((await db.auth.signInWithPassword({email,password})).error,null);
 directory=await mkdtemp(join(tmpdir(),'fdp-session-'));const headers=join(directory,'headers');
 await writeFile(headers,'Cookie: '+[...cookies].map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('; ')+'\nOrigin: '+origin+'\nContent-Type: application/json\n',{mode:0o600});
 const call=(path,extra=[])=>{
  const raw=execFileSync('npx',['vercel','curl',path,'--deployment',origin,'--','--silent','--header','@'+headers,...extra,'--write-out','\n__STATUS__%{http_code}'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:60000});
  const offset=raw.lastIndexOf('__STATUS__');return {status:Number(raw.slice(offset+10).trim()),body:raw.slice(0,offset)};
 };
 const orders=call('/api/pedidos');assert.equal(orders.status,200);assert.deepEqual(JSON.parse(orders.body).data,[]);
 const profile=call('/mi-cuenta');assert.equal(profile.status,200);assert.ok(profile.body.includes('Mi cuenta')&&profile.body.includes(email));
 const denied=call('/admin');assert.ok(denied.status===307 || (denied.body.includes('__next-page-redirect')&&denied.body.includes('url=/mi-cuenta')));
 assert.equal(call('/api/experiencias',['--request','POST','--data','{}']).status,403);
 console.log('PASS Preview publicada: sesión normal, perfil propio200, pedidos propios200, cliente bloqueado en admin/API403. Sin datos personales ni secretos en salida.');
}catch(error){console.error('FAIL Preview publicada:',error.name,'(detalles omitidos)');process.exitCode=1;}
finally{
 if(db)await db.auth.signOut({scope:'local'}).catch(()=>{});
 if(directory)await rm(directory,{recursive:true,force:true});
 if(user){const r=await admin.auth.admin.deleteUser(user.id);if(r.error){console.error('No se confirmó limpieza QA');process.exitCode=1;}else console.log('Cuenta QA y temporal privado eliminados.');}
}
