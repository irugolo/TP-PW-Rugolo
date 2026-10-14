import 'server-only';
import {createClient} from '@supabase/supabase-js';
export function paymentConfig() {
 const env=process.env;
 if(env.MP_TEST_MODE!=='true'||env.NEXT_PUBLIC_SUPABASE_URL!=='https://kulvagylilutnpckpiuw.supabase.co'||env.VERCEL_ENV==='production')throw Object.assign(Error('Los pagos de prueba no están disponibles.'),{status:503});
 if(!env.MP_TEST_ACCESS_TOKEN||!env.MP_TEST_SELLER_ID||!env.SUPABASE_SERVICE_ROLE_KEY)throw Object.assign(Error('Falta configurar pagos de prueba.'),{status:503});
 return {token:env.MP_TEST_ACCESS_TOKEN,seller:env.MP_TEST_SELLER_ID,secret:env.MP_WEBHOOK_SECRET,base:env.MP_BASE_URL};
}
export function paymentDatabase() {
 paymentConfig();return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,options)=>fetch(input,{...options,signal:AbortSignal.timeout(8000)})}});
}
export async function mpRequest(path,{method='GET',body}={}) {
 const cfg=paymentConfig();
 const response=await fetch('https://api.mercadopago.com'+path,{method,headers:{Authorization:`Bearer ${cfg.token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(8000),cache:'no-store'});
 if(!response.ok)throw Object.assign(Error('Mercado Pago no respondió correctamente. Intentá más tarde.'),{status:502});
 return response.json();
}
export async function verifyTestSeller() {
 const cfg=paymentConfig(),seller=await mpRequest('/users/me');
 if(String(seller.id)!==cfg.seller||seller.site_id!=='MLA'||!seller.tags?.includes('test_user'))throw Object.assign(Error('No se confirmó el vendedor de prueba.'),{status:503});
 return cfg;
}
