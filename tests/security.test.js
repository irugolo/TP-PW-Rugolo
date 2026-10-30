import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
mock.module('server-only',{defaultExport:{}});
let user=null, role='cliente', invalid=false, resource=null, calls=0;
const db={auth:{getUser:async()=>({data:{user},error:invalid?new Error('expired'):null})},from(table){
 calls++;const query={select(){return this;},eq(){return this;},single:async()=>({data:{id:user.id,rol:role},error:null}),maybeSingle:async()=>({data:resource,error:null})};
 if(table==='perfiles')return query;
 return query;
}};
mock.module('../src/lib/supabase/server.js',{namedExports:{supabaseServer:async()=>db}});
mock.module('../src/lib/catalog.js',{namedExports:{catalog:async()=>[]}});
mock.module('../src/lib/mp-server.js',{namedExports:{paymentConfig:()=>({}),verifyTestSeller:async()=>({}),paymentDatabase:()=>{throw Error('Privileged access not allowed');},mpRequest:async()=>{throw Error('No payment API calls');}}});
const {identity}=await import('../src/lib/access.js');
const {POST:create}=await import('../src/app/api/experiencias/route.js');
const {PATCH:update,DELETE:remove}=await import('../src/app/api/experiencias/[id]/route.js');
const {PATCH:profile}=await import('../src/app/api/perfil/route.js');
const {GET:order}=await import('../src/app/api/pedidos/[id]/route.js');
const {POST:newOrder}=await import('../src/app/api/pedidos/route.js');
const origin='http://localhost:3000';process.env.APP_ORIGIN=origin;
const req=()=>new Request(origin+'/api/test',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'});
const params={params:Promise.resolve({id:'11111111-1111-4111-8111-111111111111'})};
test('endpoints directos: visitante/sesión inválida 401 antes de consultar datos',async()=>{
 for(const expired of [false,true]){
  user=expired?{id:'u',user_metadata:{rol:'admin'}}:null;invalid=expired;calls=0;
  for(const fn of [create,update,remove,profile,newOrder,order]){const response=await fn(req(),params);assert.equal(response.status,401);assert.match(response.headers.get('cache-control'),/no-store/);}
  assert.equal(calls,0);
 }
});
test('rol confiable y revocación de admin: no se usa metadata ni se cachea perfil',async()=>{
 user={id:'u',user_metadata:{rol:'admin'}};invalid=false;role='cliente';
 for(const fn of [create,update,remove])assert.equal((await fn(req(),params)).status,403);
 role='admin';assert.equal((await identity(true)).profile.rol,'admin');
 role='cliente';await assert.rejects(identity(true),e=>e.status===403);
});
test('pedido ajeno/inexistente: mismo 404 (RLS simulado); rol inyectado rechazado',async()=>{
 resource=null;assert.equal((await order(req(),params)).status,404);
 const response=await profile(new Request(origin+'/api/perfil',{method:'PATCH',headers:{origin,'content-type':'application/json'},body:JSON.stringify({nombre:'Ana',telefono:'',rol:'admin'})}));
 assert.equal(response.status,422);
});
test('cookies HTTPS con Secure y SameSite, compatibles con renovación del cliente',async()=>{
 const {sessionCookieOptions}=await import('../src/lib/supabase/config.js');
 assert.deepEqual(sessionCookieOptions(true),{path:'/',sameSite:'lax',secure:true,httpOnly:false});
 assert.equal(sessionCookieOptions(false).secure,false);
});
