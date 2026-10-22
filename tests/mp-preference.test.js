import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedPreferenceUrl} from '../src/lib/mp-preference.js';
import {orderStatus} from '../src/lib/order-status.js';
import {WEBHOOK_URL} from '../supabase/functions/_shared/payment-webhook.js';
const order={id:'order-fixture',experiencia_id:'ceramica-y-vino',cantidad:1,precio:50000};
const cfg={seller:'123',base:'https://preview.example.com'};
const preference={id:'123-fixture',collector_id:123,external_reference:order.id,items:[{id:order.experiencia_id,quantity:1,unit_price:50000,currency_id:'ARS'}],notification_url:WEBHOOK_URL,back_urls:Object.fromEntries(['success','pending','failure'].map(k=>[k,cfg.base+'/pedidos/'+order.id])),expires:true,expiration_date_to:'2030-01-01T00:00:00Z',init_point:'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123-fixture'};
test('checkout: accepts only matching preference and rejects expired, foreign, altered or wrong URLs',()=>{
 assert.equal(verifiedPreferenceUrl(preference,order,cfg,0),preference.init_point);
 for(const patch of [{collector_id:999},{external_reference:'other'},{items:[{...preference.items[0],unit_price:1}]},{items:[{...preference.items[0],currency_id:'USD'}]},{items:[{...preference.items[0],quantity:2}]},{notification_url:'https://other.example'},{back_urls:{}},{expires:false},{expiration_date_to:'invalid'},{expiration_date_to:'1970-01-01T00:00:00Z'},{init_point:'https://evil.example/?pref_id=123-fixture'},{init_point:'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=other'}])assert.throws(()=>verifiedPreferenceUrl({...preference,...patch},order,cfg,1));
});
test('order state comes from stored payment, not checkout creation or return query',()=>{
 assert.equal(orderStatus({estado:'pendiente',checkout_url:'exists',status:'approved'},[]).title,'Pendiente de pago');
 assert.equal(orderStatus({estado:'pendiente'},[{estado:'pending'}]).title,'Estamos verificando tu pago');
 assert.equal(orderStatus({estado:'pendiente'},[{estado:'rejected'}]).title,'Pendiente de pago');
 assert.equal(orderStatus({estado:'pagado'},[]).title,'¡Compra exitosa!');
});
