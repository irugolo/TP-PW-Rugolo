import {verifyPaymentSignature} from '../../../../lib/mp-signature';
import {paymentConfig,paymentDatabase,mpRequest} from '../../../../lib/mp-server';
export const runtime='nodejs';
export const maxDuration=30;
export async function POST(request) {
 try {
  const cfg=paymentConfig();
  if(!cfg.secret)return Response.json({error:'Webhook sin configurar.'},{status:503});
  const id=verifyPaymentSignature(request,cfg.secret);
  if(!id)return Response.json({error:'Firma inválida.'},{status:401});
  const raw=await request.text();if(raw.length>16000)return Response.json({error:'Notificación demasiado grande.'},{status:413});
  let event;try{event=JSON.parse(raw);}catch{return Response.json({error:'JSON inválido.'},{status:400});}
  if(event.type!=='payment'||String(event.data?.id)!==id)return Response.json({error:'Evento inválido.'},{status:400});
  const payment=await mpRequest('/v1/payments/'+id);
  if(payment.live_mode!==false||String(payment.collector_id)!==cfg.seller||String(payment.id)!==id||payment.currency_id!=='ARS')return Response.json({error:'Pago ajeno al entorno autorizado.'},{status:422});
  if(!/^[a-f0-9-]{36}$/i.test(payment.external_reference||''))return Response.json({error:'Referencia inválida.'},{status:422});
  const db=paymentDatabase();
  const {data:order,error}=await db.from('pedidos_demo').select('id,total').eq('id',payment.external_reference).maybeSingle();
  if(error)throw error;
  if(!order||Math.round(Number(order.total)*100)!==Math.round(Number(payment.transaction_amount)*100))return Response.json({error:'Importe o pedido no coincide.'},{status:422});
  if(!['approved','pending','in_process','rejected','cancelled','refunded'].includes(payment.status))return Response.json({error:'Estado requiere revisión.'},{status:422});
  const reconciled=await db.rpc('conciliar_pago_demo',{p_pedido:order.id,p_id:id,p_estado:payment.status,p_actualizado:payment.date_last_updated,p_importe:payment.transaction_amount,p_moneda:payment.currency_id,p_vendedor:String(payment.collector_id),p_live:payment.live_mode});
  if(reconciled.error)throw reconciled.error;
  return Response.json({received:true}); // Only after transaction commits. No background work.
 }catch{return Response.json({error:'No se pudo procesar; reintentar.'},{status:503});}
}
