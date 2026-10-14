import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {verifyPaymentSignature} from '../src/lib/mp-signature.js';
test('firma payment: correcta, duplicada, alterada e incompleta',async()=>{
 const secret='only-fixture',ts='1742505638683',rid='test-request';
 const hash=createHmac('sha256',secret).update(`id:123;request-id:${rid};ts:${ts};`).digest('hex');
 const req=(query='data.id=123',signature=`ts=${ts},v1=${hash}`)=>new Request('https://example.com/webhook?'+query,{headers:{'x-request-id':rid,'x-signature':signature}});
 assert.equal(await verifyPaymentSignature(req(),secret),'123');assert.equal(await verifyPaymentSignature(req(),secret),'123');
 assert.equal(await verifyPaymentSignature(req('data.id=124'),secret),null);assert.equal(await verifyPaymentSignature(req('data.id=123&data.id=124'),secret),null);
 assert.equal(await verifyPaymentSignature(req('data.id=123','ts=1,v1=bad'),secret),null);assert.equal(await verifyPaymentSignature(req(),'wrong'),null);
});
