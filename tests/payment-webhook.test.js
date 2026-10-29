import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {handlePaymentWebhook,PREVIEW_URL} from '../supabase/functions/_shared/payment-webhook.js';
const cfg={url:PREVIEW_URL,mode:'true',token:'fixture-token',seller:'42',serviceKey:'fixture-service',secret:'fixture-secret'};
const orderId='11111111-1111-4111-8111-111111111111';
const payment={id:123,collector_id:42,live_mode:false,currency_id:'ARS',transaction_amount:100,external_reference:orderId,status:'approved',date_last_updated:'2026-10-14T10:00:00Z'};
function request(body={type:'payment',data:{id:123}},signed=true) {
 const ts='1791972000000',rid='fixture-request';
 const hash=createHmac('sha256',cfg.secret).update(`id:123;request-id:${rid};ts:${ts};`).digest('hex');
 return new Request(PREVIEW_URL+'/functions/v1/mercadopago-webhook?data.id=123',{method:'POST',headers:signed?{'x-request-id':rid,'x-signature':`ts=${ts},v1=${hash}`}:{},body:typeof body==='string'?body:JSON.stringify(body)});
}
function upstream(overrides={},failAt=0) {
 const calls=[];
 const fetcher=async(url,options)=>{
  calls.push({url,options});
  if(calls.length===failAt)throw Error('sensitive upstream error');
  return Response.json(calls.length===1?{...payment,...overrides}:calls.length===2?[{id:orderId,total:100}]:{estado:'pagado'});
 };
 return {calls,fetcher};
}
test('webhook fails closed on signature, method, wrong project and disabled mode without external calls',async()=>{
 const fetcher=()=>{throw Error('must not fetch');};
 assert.equal((await handlePaymentWebhook(request({},false),cfg,fetcher)).status,401);
 assert.equal((await handlePaymentWebhook(new Request(PREVIEW_URL),cfg,fetcher)).status,405);
 for(const patch of [{url:'https://production.supabase.co'},{mode:'false'},{secret:''}])assert.equal((await handlePaymentWebhook(request(),{...cfg,...patch},fetcher)).status,503);
});
test('webhook rejects oversized, malformed or mismatched body before MP API',async()=>{
 const fetcher=()=>{throw Error('must not fetch');};
 for(const [body,status] of [['x'.repeat(16001),413],['{',400],[{type:'payment',data:{id:124}},400],[null,400]])assert.equal((await handlePaymentWebhook(request(body),cfg,fetcher)).status,status);
});
test('webhook queries authoritative payment and waits for reconciliation commit',async()=>{
 const {calls,fetcher}=upstream();
 const result=await handlePaymentWebhook(request(),cfg,fetcher);
 assert.equal(result.status,200);assert.equal(calls.length,3);
 assert.equal(calls[0].url,'https://api.mercadopago.com/v1/payments/123');
 assert.equal(calls[2].url,PREVIEW_URL+'/rest/v1/rpc/conciliar_pago_demo');
 assert.equal(JSON.parse(calls[2].options.body).p_live,false);
 assert.equal(JSON.parse(calls[2].options.body).p_pedido,orderId);
 assert.ok(calls.every(c=>c.options.redirect==='error'));
});
test('live, foreign seller, currency, id, reference, amount and unsupported states never reconcile',async()=>{
 for(const patch of [{live_mode:true},{collector_id:43},{currency_id:'USD'},{id:124},{external_reference:'invalid'},{transaction_amount:101},{status:'charged_back'},{date_last_updated:'invalid'}]){
  const {fetcher,calls}=upstream(patch);
  assert.equal((await handlePaymentWebhook(request(),cfg,fetcher)).status,422);
  assert.ok(calls.length<3);
 }
});
test('API/read/commit errors return retryable sanitized response, never acknowledge failure',async()=>{
 for(const step of [1,2,3]){
  const {fetcher}=upstream({},step);
  const response=await handlePaymentWebhook(request(),cfg,fetcher);
  assert.equal(response.status,503);assert.ok(!(await response.text()).includes('sensitive'));
 }
});
test('verified test-account checkout preserves live_mode=true and rejects other buyers/sellers',async()=>{
 const testCfg={...cfg,seller:'3762598376'};
 const testPayment={...payment,collector_id:3762598376,live_mode:true,payer:{id:'3762598386'},statement_descriptor:'Mercadopago*fake'};
 for(const [patch,sellerPatch,status] of [[{},{},200],[{payer:{id:'other'}},{},422],[{statement_descriptor:'REAL'},{},422],[{},{tags:[]},422]]){
  const calls=[];
  const fetcher=async(url,options)=>{
   calls.push({url,options});
   if(url.includes('/v1/payments/'))return Response.json({...testPayment,...patch});
   if(url.endsWith('/users/me'))return Response.json({id:3762598376,site_id:'MLA',tags:['test_user'],...sellerPatch});
   if(url.includes('/pedidos_demo?'))return Response.json([{id:orderId,total:100}]);
   return Response.json('pagado');
  };
  const response=await handlePaymentWebhook(request(),testCfg,fetcher);
  assert.equal(response.status,status);
  const rpc=calls.find(c=>c.url.includes('/rpc/'));
  if(status===200){const body=JSON.parse(rpc.options.body);assert.equal(body.p_live,true);assert.equal(body.p_cuentas_test,true);assert.equal(body.p_comprador,'3762598386');}
  else assert.equal(rpc,undefined);
 }
});
test('correlation is returned without leaking payload or provider failure',async()=>{
 const {fetcher}=upstream({},1);
 const response=await handlePaymentWebhook(request(),cfg,fetcher);
 assert.match(response.headers.get('x-correlation-id'),/^[a-f0-9-]{36}$/);
 assert.equal(response.status,503);
 const text=await response.text();
 for(const value of [cfg.token,cfg.secret,cfg.serviceKey,orderId,'sensitive'])assert.equal(text.includes(value),false);
});
