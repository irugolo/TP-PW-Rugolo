// Explicit allowlist. Production is disabled unless deliberately enabled after release approval.
export const PREVIEW_URL = 'https://kulvagylilutnpckpiuw.supabase.co';
export const PRODUCTION_URL = 'https://lvkglhdckvnkixglyvms.supabase.co';
export function demoEnvironment(url, productionEnabled) {
 if (url === PREVIEW_URL) return {base:'https://tp-pw-rugolo-e4e6-programacion-web.vercel.app',webhook:url+'/functions/v1/mercadopago-webhook'};
 if (url === PRODUCTION_URL && productionEnabled === 'true') return {base:'https://tp-pw-rugolo.vercel.app',webhook:url+'/functions/v1/mercadopago-webhook'};
 return null;
}
export function checkoutEnvironment(env) {
 const url=env.NEXT_PUBLIC_SUPABASE_URL;
 const target=demoEnvironment(url,env.MP_DEMO_PRODUCTION_ENABLED);
 if (!target || env.MP_TEST_MODE!=='true' || env.MP_BASE_URL!==target.base) return null;
 // Never let a production deployment use the Preview database (or vice versa).
 if (env.VERCEL_ENV==='production' ? url!==PRODUCTION_URL : url!==PREVIEW_URL) return null;
 return target;
}
