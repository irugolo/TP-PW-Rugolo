import {z} from 'zod';
import {identity} from '../../../../../lib/access';
import {checkOrigin,failure} from '../../../../../lib/http';
import {paymentDatabase,mpRequest,verifyTestSeller} from '../../../../../lib/mp-server';
export async function POST(request,{params}) {
 let claimed,service;
 try {
  checkOrigin(request);const {id}=await params;if(!z.uuid().safeParse(id).success)return Response.json({error:'Pedido inválido.'},{status:400});
  const {db,user}=await identity();const cfg=await verifyTestSeller();
  const base=new URL(cfg.base);if(base.protocol!=='https:'||base.origin!==cfg.base||base.hostname==='tp-pw-rugolo.vercel.app')throw Error('Invalid preview origin');
  const {data:order,error}=await db.from('pedidos_demo').select('*').eq('id',id).eq('propietario',user.id).maybeSingle();
  if(error)throw error;if(!order)return Response.json({error:'Pedido no encontrado.'},{status:404});
  if(order.estado==='pagado'||order.estado==='reembolsado'||order.estado==='revision')return Response.json({error:'Este pedido no admite otro checkout.'},{status:409});
  const available=await db.from('cupos_demo').select('capacidad,ocupados').eq('experiencia_id',order.experiencia_id).maybeSingle();
  if(available.error)throw available.error;
  if(!available.data||available.data.capacidad-available.data.ocupados<order.cantidad)return Response.json({error:'La experiencia ya no está disponible o no tiene cupos suficientes.'},{status:409});
  if(order.checkout_url)return Response.json({url:order.checkout_url});
  service=paymentDatabase();
  const lock=await service.from('pedidos_demo').update({preferencia_estado:'creando'}).eq('id',id).eq('preferencia_estado','nueva').select('id').maybeSingle();
  if(lock.error)throw lock.error;if(!lock.data)return Response.json({error:'La preferencia está en proceso o requiere revisión. No se creará un cobro duplicado.'},{status:409});
  claimed=id;
  const preference=await mpRequest('/checkout/preferences',{method:'POST',body:{items:[{id:order.experiencia_id,title:order.nombre,description:order.descripcion,quantity:order.cantidad,unit_price:Number(order.precio),currency_id:'ARS'}],external_reference:id,back_urls:{success:cfg.base+'/pedidos/'+id,pending:cfg.base+'/pedidos/'+id,failure:cfg.base+'/pedidos/'+id},notification_url:cfg.base+'/api/webhooks/mercadopago',auto_return:'approved',expires:true,expiration_date_to:new Date(Date.now()+30*60000).toISOString()}});
  const checkout=new URL(preference.init_point);
  if(checkout.protocol!=='https:'||checkout.hostname!=='www.mercadopago.com.ar'||!preference.id)throw Error('Invalid checkout URL');
  const saved=await service.from('pedidos_demo').update({preferencia_id:String(preference.id),checkout_url:checkout.href,preferencia_estado:'lista'}).eq('id',id);
  if(saved.error)throw saved.error;return Response.json({url:checkout.href});
 }catch(error){if(claimed)await service.from('pedidos_demo').update({preferencia_estado:'incierta'}).eq('id',claimed).eq('preferencia_estado','creando');return failure(error);}
}
