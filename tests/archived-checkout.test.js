import test,{mock} from 'node:test';
import assert from 'node:assert/strict';
let experience=null,calls=0;
const order={id:'11111111-1111-4111-8111-111111111111',propietario:'owner',experiencia_id:'old',estado:'pendiente',cantidad:1};
const db={from(table){const q={select(){return q;},eq(){return q;},async maybeSingle(){return {data:table==='pedidos_demo'?order:experience,error:null};}};return q;}};
mock.module('../src/lib/access.js',{namedExports:{identity:async()=>({db,user:{id:'owner'}})}});
mock.module('../src/lib/mp-server.js',{namedExports:{verifyTestSeller:async()=>({secret:'fixture'}),paymentDatabase:()=>{throw Error('must not mutate');},mpRequest:async()=>{calls++;throw Error('must not call');}}});
const {POST}=await import('../src/app/api/pedidos/[id]/checkout/route.js');
test('checkout rechaza archivados y cantidad fija incompatible antes de consultar Mercado Pago',async()=>{
 process.env.APP_ORIGIN='https://preview.example';
 for(const item of [null,{estado:'borrador',cantidad_fija:0},{estado:'publicado',cantidad_fija:2}]){
 experience=item;const response=await POST(new Request('https://preview.example/api/pedidos/'+order.id+'/checkout',{method:'POST',headers:{origin:'https://preview.example','content-type':'application/json'}}),{params:Promise.resolve({id:order.id})});assert.equal(response.status,409);
 }assert.equal(calls,0);
});
