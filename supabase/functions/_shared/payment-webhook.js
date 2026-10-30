// Shared by Next.js and the public Preview Edge Function; no framework dependencies.
import {PREVIEW_URL,demoEnvironment} from './demo-environment.js';
export {PREVIEW_URL};
export const WEBHOOK_URL = PREVIEW_URL + '/functions/v1/mercadopago-webhook';
// Fixed demo pair verified with /users/me and the author's test-account dashboard.
export const TEST_SELLER = '3762598376';
export const TEST_BUYER = '3762598386';
const reply = (status, error) => Response.json(error ? {error} : {received:true}, {status});

export async function verifyPaymentSignature(request, secret) {
 const query = new URL(request.url).searchParams;
 const id = query.get('data.id'), requestId = request.headers.get('x-request-id');
 if (!secret || query.getAll('data.id').length !== 1 || !/^\d{1,30}$/.test(id || '') || !/^[\w-]{1,200}$/.test(requestId || '')) return null;
 const parts = (request.headers.get('x-signature') || '').split(',').map(s => s.trim().split('='));
 const timestamps = parts.filter(([k]) => k === 'ts'), hashes = parts.filter(([k]) => k === 'v1');
 if (timestamps.length !== 1 || hashes.length !== 1 || timestamps[0].length !== 2 || hashes[0].length !== 2) return null;
 const ts = timestamps[0][1], hash = hashes[0][1];
 if (!/^\d{10,16}$/.test(ts || '') || !/^[a-fA-F0-9]{64}$/.test(hash || '')) return null;
 const encoder = new TextEncoder();
 const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['verify']);
 const signature = Uint8Array.from(hash.match(/../g), byte => parseInt(byte,16));
 return await crypto.subtle.verify('HMAC', key, signature, encoder.encode(`id:${id};request-id:${requestId};ts:${ts};`)) ? id : null;
}

async function readEvent(request) {
 const reader = request.body?.getReader();
 if (!reader) return null;
 const chunks = []; let size = 0;
 try {
  while (true) {
   const {done,value} = await reader.read(); if (done) break;
   size += value.byteLength;
   if (size > 16000) { await reader.cancel(); throw Object.assign(Error(), {status:413}); }
   chunks.push(value);
  }
 } finally { reader.releaseLock(); }
 const bytes = new Uint8Array(size); let offset = 0;
 for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
 try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { return null; }
}

async function processPaymentWebhook(request, cfg, fetcher = fetch) {
 if (request.method !== 'POST') return reply(405, 'Método no permitido.');
 try {
  // Fail closed even if accidentally deployed to another project or with live settings.
  if (!demoEnvironment(cfg.url,cfg.productionEnabled) || cfg.mode !== 'true' || !cfg.token || !/^\d+$/.test(cfg.seller || '') || !cfg.serviceKey || !cfg.secret) return reply(503,'Webhook sin configurar.');
  const id = await verifyPaymentSignature(request,cfg.secret);
  if (!id) return reply(401,'Firma inválida.');
  const event = await readEvent(request);
  if (!event || event.type !== 'payment' || String(event.data?.id) !== id) return reply(400,'Evento inválido.');
  // One deadline for the complete API + database transaction, within MP's 22s window.
  const signal = AbortSignal.timeout(18000);
  const call = async (url,options) => {
   const response = await fetcher(url,{...options,signal,redirect:'error',cache:'no-store'});
   if (!response.ok) throw Error('Upstream unavailable');
   return response.json();
  };
  const payment = await call('https://api.mercadopago.com/v1/payments/'+id,{headers:{Authorization:'Bearer '+cfg.token}});
  if (typeof payment.live_mode !== 'boolean' || String(payment.collector_id) !== cfg.seller || String(payment.id) !== id || payment.currency_id !== 'ARS') return reply(422,'Pago ajeno al entorno autorizado.');
  let verifiedTestAccounts = false;
  if (payment.live_mode) {
   // Preferences created by a test seller can report live_mode=true. Never accept
   // this flag alone or rewrite it: verify the fixed test pair and API evidence.
   if (cfg.seller !== TEST_SELLER || String(payment.payer?.id) !== TEST_BUYER || payment.statement_descriptor !== 'Mercadopago*fake') return reply(422,'Cuentas de prueba no verificadas.');
   const seller = await call('https://api.mercadopago.com/users/me',{headers:{Authorization:'Bearer '+cfg.token}});
   verifiedTestAccounts = String(seller.id) === TEST_SELLER && seller.site_id === 'MLA' && seller.tags?.includes('test_user') === true;
   if (!verifiedTestAccounts) return reply(422,'Vendedor de prueba no verificado.');
  }
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(payment.external_reference || '')) return reply(422,'Referencia inválida.');
  if (!['approved','pending','in_process','rejected','cancelled','refunded'].includes(payment.status) || !Number.isFinite(Date.parse(payment.date_last_updated))) return reply(422,'Estado requiere revisión.');
  const headers = {apikey:cfg.serviceKey,Authorization:'Bearer '+cfg.serviceKey,'Content-Type':'application/json'};
  const orders = await call(cfg.url+'/rest/v1/pedidos_demo?select=id,total&id=eq.'+payment.external_reference,{headers});
  const order = orders[0], amount = Number(payment.transaction_amount);
  if (!order || !Number.isFinite(amount) || amount <= 0 || Math.round(Number(order.total)*100) !== Math.round(amount*100)) return reply(422,'Importe o pedido no coincide.');
  await call(cfg.url+'/rest/v1/rpc/conciliar_pago_demo',{method:'POST',headers,body:JSON.stringify({p_pedido:order.id,p_id:id,p_estado:payment.status,p_actualizado:payment.date_last_updated,p_importe:payment.transaction_amount,p_moneda:payment.currency_id,p_vendedor:String(payment.collector_id),p_live:payment.live_mode,p_comprador:verifiedTestAccounts?String(payment.payer.id):null,p_cuentas_test:verifiedTestAccounts})});
  return reply(200); // Only after the idempotent SQL transaction commits; never from redirect data.
 } catch (error) {
  return error.status === 413 ? reply(413,'Notificación demasiado grande.') : reply(503,'No se pudo procesar; reintentar.');
 }
}

// Safe operational correlation: never log payloads, emails, tokens or provider errors.
export async function handlePaymentWebhook(request, cfg, fetcher = fetch) {
 const correlation = crypto.randomUUID(); const started = Date.now();
 const response = await processPaymentWebhook(request, cfg, fetcher);
 response.headers.set('x-correlation-id', correlation);
 console.info(JSON.stringify({component:'payment-webhook',correlation,status:response.status,duration_ms:Date.now()-started}));
 return response;
}
