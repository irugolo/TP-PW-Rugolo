import {handlePaymentWebhook} from '../_shared/payment-webhook.js';
// Each project uses its own secrets and database; Production requires explicit opt-in.
Deno.serve(request => handlePaymentWebhook(request, {
 url:Deno.env.get('SUPABASE_URL'), serviceKey:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
 productionEnabled:Deno.env.get('MP_DEMO_PRODUCTION_ENABLED'),
 mode:Deno.env.get('MP_TEST_MODE'), token:Deno.env.get('MP_TEST_ACCESS_TOKEN'),
 seller:Deno.env.get('MP_TEST_SELLER_ID'), secret:Deno.env.get('MP_WEBHOOK_SECRET'),
}));
