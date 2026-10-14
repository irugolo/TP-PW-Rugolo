import {createHmac,timingSafeEqual} from 'node:crypto';
// Mercado Pago HMAC manifest: query data.id, x-request-id, signature ts.
// Payment IDs are numeric; requiring all fields rejects incomplete notifications.
export function verifyPaymentSignature(request,secret) {
 const params=new URL(request.url).searchParams;
 const id=params.get('data.id'), requestId=request.headers.get('x-request-id');
 if(!secret || params.getAll('data.id').length!==1 || !/^\d{1,30}$/.test(id||'') || !/^[\w-]{1,200}$/.test(requestId||''))return null;
 const parts=(request.headers.get('x-signature')||'').split(',').map(s=>s.trim().split('='));
 const timestamps=parts.filter(([k])=>k==='ts'), hashes=parts.filter(([k])=>k==='v1');
 if(timestamps.length!==1||hashes.length!==1)return null;
 const ts=timestamps[0][1], hash=hashes[0][1];
 if(!/^\d{10,16}$/.test(ts||'')||!/^[a-fA-F0-9]{64}$/.test(hash||''))return null;
 const expected=createHmac('sha256',secret).update(`id:${id};request-id:${requestId};ts:${ts};`).digest();
 return timingSafeEqual(expected,Buffer.from(hash,'hex'))?id:null;
}
