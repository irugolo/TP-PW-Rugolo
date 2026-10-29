// Preview only. Temporary accounts, no emails, no personal browser sessions or traces.
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {experiencias} from '../src/data/experiencias.js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(url!=='https://kulvagylilutnpckpiuw.supabase.co')throw Error('Solo Preview autorizado.');
const origin='http://localhost:3300';
async function accessible(page){
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.deepEqual((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>v.id),[]);
 }
}
const keys=JSON.parse(execFileSync('npx',['supabase','projects','api-keys','--project-ref','kulvagylilutnpckpiuw','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const service=createClient(url,keys.find(x=>x.name==='service_role').api_key,{auth:{persistSession:false,autoRefreshToken:false}});
const users=[],clients=[];let browser;const fixture='qa-'+randomUUID();
try{
 for(let i=0;i<2;i++){
  const email=`qa-${randomUUID()}@example.invalid`,password=randomUUID()+'Aa9!';
  const {data,error}=await service.auth.admin.createUser({email,password,email_confirm:true});if(error)throw Error('fixture creation');
  users.push({...data.user,password});
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});clients.push(db);
  const login=await db.auth.signInWithPassword({email,password});assert.equal(login.error,null);
 }
 assert.equal((await clients[0].from('perfiles').select('id').eq('id',users[1].id)).data.length,0);
 assert.ok((await clients[0].from('perfiles').update({rol:'admin'}).eq('id',users[0].id)).error);
 browser=await chromium.launch({headless:true});const context=await browser.newContext();const page=await context.newPage();
 await page.goto(origin+'/auth');await page.getByLabel('Email').fill(users[0].email);await page.getByLabel('Contraseña',{exact:true}).fill(users[0].password);
 await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.waitForURL(origin+'/mi-cuenta');
 await page.reload();await page.getByRole('heading',{name:'Mi cuenta',exact:true}).waitFor();await accessible(page);
 await page.goto(origin+'/pedidos');await page.getByRole('heading',{level:1}).waitFor();await accessible(page);
 await page.goto(origin+'/admin');await page.waitForURL(origin+'/mi-cuenta');
 assert.equal((await page.request.post(origin+'/api/experiencias',{headers:{Origin:origin},data:{}})).status(),403);
 // Promote only this newly created QA UUID; never a real account.
 const promoted=await service.from('perfiles').update({rol:'admin'}).eq('id',users[0].id);assert.equal(promoted.error,null);
 await page.goto(origin+'/admin');await page.getByRole('heading',{name:'Administración',exact:true}).waitFor();await accessible(page);
 const body={...experiencias[0],id:fixture,nombre:'Fixture QA',estado:'borrador'};
 const request=(method,path,data)=>page.request.fetch(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json'},data});
 assert.equal((await request('POST','/api/experiencias',body)).status(),201);
 assert.equal((await page.request.get(origin+'/api/experiencias/'+fixture)).status(),404);
 assert.equal((await request('PATCH','/api/experiencias/'+fixture,{...body,estado:'publicado'})).status(),200);
 assert.equal((await clients[1].from('experiencias').select('id').eq('id',fixture)).data.length,1);
 await page.reload();await page.getByText('Fixture QA',{exact:true}).waitFor();
 assert.equal((await request('PATCH','/api/experiencias/'+fixture,body)).status(),200);
 assert.equal((await clients[1].from('experiencias').select('id').eq('id',fixture)).data.length,0);
 assert.equal((await request('DELETE','/api/experiencias/'+fixture)).status(),200);
 const demoted=await service.from('perfiles').update({rol:'cliente'}).eq('id',users[0].id);assert.equal(demoted.error,null);
 assert.equal((await request('POST','/api/experiencias',body)).status(),403);
 await page.goto(origin+'/mi-cuenta');await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await page.waitForURL(origin+'/auth');
 await page.goto(origin+'/mi-cuenta');await page.waitForURL(origin+'/auth');
 // Verify real provider refresh; tokens stay exclusively in memory.
 assert.equal((await clients[1].auth.refreshSession()).error,null);
 const refresh=(await clients[1].auth.getSession()).data.session.refresh_token;
 await clients[1].auth.signOut({scope:'local'});
 assert.ok((await clients[1].auth.refreshSession({refresh_token:refresh})).error);
 console.log('PASS sesiones reales Preview: login/reload/logout headless, cliente 403, CRUD y persistencia en otra sesión, borradores, cambio de rol inmediato, refresh válido y refresh revocado rechazado. No recovery/email en esta prueba.');
}catch(e){console.error('FAIL recorrido aislado:',e.name,'(detalles privados omitidos)');process.exitCode=1;}
finally{
 if(browser)await browser.close();
 for(const db of clients)await db.auth.signOut({scope:'local'}).catch(()=>{});
 const removed=await service.from('experiencias').delete().eq('id',fixture);if(removed.error){console.error('Revisar fixture',fixture);process.exitCode=1;}
 for(const u of users){const r=await service.auth.admin.deleteUser(u.id);if(r.error){console.error('No se confirmó limpieza QA');process.exitCode=1;}}
 console.log('Limpieza de cuentas y experiencia QA finalizada.');
}
