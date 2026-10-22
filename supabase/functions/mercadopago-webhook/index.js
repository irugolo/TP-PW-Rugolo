import {handlePaymentWebhook} from '../_shared/payment-webhook.js';
// Secrets are available only in the existing Supabase Preview project.
Deno.serve(request => handlePaymentWebhook(request, {
 url:Deno.env.get('SUPABASE_URL'), serviceKey:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
 mode:Deno.env.get('MP_TEST_MODE'), token:Deno.env.get('MP_TEST_ACCESS_TOKEN'),
 seller:Deno.env.get('MP_TEST_SELLER_ID'), secret:Deno.env.get('MP_WEBHOOK_SECRET'),
}));
