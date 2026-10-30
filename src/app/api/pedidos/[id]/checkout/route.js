import {verifiedPreferenceUrl} from '../../../../../lib/mp-preference';
import {z} from 'zod';
import {identity} from '../../../../../lib/access';
import {checkOrigin,failure} from '../../../../../lib/http';
import {paymentDatabase,mpRequest,verifyTestSeller} from '../../../../../lib/mp-server';
export async function POST(request,{params}) {
 let claimed,service;
 try {
  checkOrigin(request);const {id}=await params;if(!z.uuid().safeParse(id).success)return Response.json({error:'Pedido inválido.'},{status:400});
  const {db,user}=await identity();const cfg=await verifyTestSeller();
  if(!cfg.secret)return Response.json({error:'Falta terminar la configuración del webhook de prueba.'},{status:503});
  const {data:order,error}=await db.from('pedidos_demo').select('*').eq('id',id).eq('propietario',user.id).maybeSingle();
  if(error)throw error;if(!order)return Response.json({error:'Pedido no encontrado.'},{status:404});
  if(order.estado==='pagado'||order.estado==='reembolsado'||order.estado==='revision')return Response.json({error:'Este pedido no admite otro checkout.'},{status:409});
  const experience=await db.from('experiencias').select('estado,cantidad_fija').eq('id',order.experiencia_id).maybeSingle();
  if(experience.error)throw experience.error;
  if(!experience.data || experience.data.estado!=='publicado' || (experience.data.cantidad_fija && experience.data.cantidad_fija!==order.cantidad))return Response.json({error:'La experiencia está archivada o la cantidad ya no es válida.'},{status:409});
  const available=await db.from('cupos_demo').select('capacidad,ocupados').eq('experiencia_id',order.experiencia_id).maybeSingle();
  if(available.error)throw available.error;
  if(!available.data||available.data.capacidad-available.data.ocupados<order.cantidad)return Response.json({error:'La experiencia ya no está disponible o no tiene cupos suficientes.'},{status:409});
  if(order.checkout_url){
   const existing=await mpRequest('/checkout/preferences/'+encodeURIComponent(order.preferencia_id));
   if(String(existing.id)!==order.preferencia_id)throw Error('Preference mismatch');
   return Response.json({url:verifiedPreferenceUrl(existing,order,cfg)});
  }
  service=paymentDatabase();
  const lock=await service.from('pedidos_demo').update({preferencia_estado:'creando'}).eq('id',id).eq('preferencia_estado','nueva').select('id').maybeSingle();
  if(lock.error)throw lock.error;if(!lock.data)return Response.json({error:'La preferencia está en proceso o requiere revisión. No se creará un cobro duplicado.'},{status:409});
  claimed=id;
  const preference=await mpRequest('/checkout/preferences',{method:'POST',body:{items:[{id:order.experiencia_id,title:order.nombre,description:order.descripcion,quantity:order.cantidad,unit_price:Number(order.precio),currency_id:'ARS'}],external_reference:id,back_urls:{success:cfg.base+'/pedidos/'+id,pending:cfg.base+'/pedidos/'+id,failure:cfg.base+'/pedidos/'+id},notification_url:cfg.webhook,auto_return:'approved',expires:true,expiration_date_to:new Date(Date.now()+30*60000).toISOString()}});
  const checkout=verifiedPreferenceUrl(preference,order,cfg);
  const saved=await service.from('pedidos_demo').update({preferencia_id:String(preference.id),checkout_url:checkout,preferencia_estado:'lista'}).eq('id',id);
  if(saved.error)throw saved.error;return Response.json({url:checkout});
 }catch(error){if(claimed)await service.from('pedidos_demo').update({preferencia_estado:'incierta'}).eq('id',claimed).eq('preferencia_estado','creando');return failure(error);}
}
