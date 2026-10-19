import {WEBHOOK_URL} from '../../supabase/functions/_shared/payment-webhook.js';
export function verifiedPreferenceUrl(preference,order,cfg,now=Date.now()) {
 const invalid=()=>{throw Object.assign(Error('No se pudo verificar el checkout de prueba. No continúes con el pago.'),{status:409});};
 if(String(preference.collector_id)!==cfg.seller||preference.external_reference!==order.id||!preference.id)invalid();
 const items=preference.items;
 if(!Array.isArray(items)||items.length!==1||items[0].id!==order.experiencia_id||items[0].currency_id!=='ARS'||items[0].quantity!==order.cantidad||Math.round(Number(items[0].unit_price)*100)!==Math.round(Number(order.precio)*100))invalid();
 if(preference.notification_url!==WEBHOOK_URL||['success','pending','failure'].some(k=>preference.back_urls?.[k]!==cfg.base+'/pedidos/'+order.id))invalid();
 if(preference.expires!==true||!Number.isFinite(Date.parse(preference.expiration_date_to)))invalid();
 if(Date.parse(preference.expiration_date_to)<=now)throw Object.assign(Error('Este checkout venció. Volvé a la experiencia y creá un pedido nuevo.'),{status:409});
 let url;try{url=new URL(preference.init_point);}catch{invalid();}
 if(url.protocol!=='https:'||url.hostname!=='www.mercadopago.com.ar'||url.pathname!=='/checkout/v1/redirect'||url.username||url.password||url.port||url.searchParams.getAll('pref_id').length!==1||url.searchParams.get('pref_id')!==String(preference.id))invalid();
 return url.href;
}
