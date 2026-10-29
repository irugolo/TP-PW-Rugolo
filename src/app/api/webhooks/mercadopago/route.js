import {checkoutEnvironment} from '../../../../../supabase/functions/_shared/demo-environment.js';
import {handlePaymentWebhook} from '../../../../../supabase/functions/_shared/payment-webhook.js';
export const runtime = 'nodejs';
export const maxDuration = 30;
export async function POST(request) {
 const env = process.env;
 return handlePaymentWebhook(request, {
  url:env.NEXT_PUBLIC_SUPABASE_URL, serviceKey:env.SUPABASE_SERVICE_ROLE_KEY,
  mode:checkoutEnvironment(env) ? env.MP_TEST_MODE : 'false', productionEnabled:env.MP_DEMO_PRODUCTION_ENABLED,
  token:env.MP_TEST_ACCESS_TOKEN, seller:env.MP_TEST_SELLER_ID, secret:env.MP_WEBHOOK_SECRET,
 });
}
