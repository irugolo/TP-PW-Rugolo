import test from 'node:test';
import assert from 'node:assert/strict';
import {PREVIEW_URL,PRODUCTION_URL,demoEnvironment,checkoutEnvironment} from '../supabase/functions/_shared/demo-environment.js';
const preview={NEXT_PUBLIC_SUPABASE_URL:PREVIEW_URL,MP_TEST_MODE:'true',MP_BASE_URL:'https://tp-pw-rugolo-e4e6-programacion-web.vercel.app',VERCEL_ENV:'preview'};
test('demo environments fail closed; no cross-database deployment or arbitrary callback origin',()=>{
 assert.ok(checkoutEnvironment(preview));
 for(const patch of [{VERCEL_ENV:'production'},{MP_TEST_MODE:'false'},{MP_BASE_URL:'https://evil.example'},{NEXT_PUBLIC_SUPABASE_URL:PRODUCTION_URL},{NEXT_PUBLIC_SUPABASE_URL:'https://unknown.supabase.co'}])assert.equal(checkoutEnvironment({...preview,...patch}),null);
 const prod={...preview,VERCEL_ENV:'production',NEXT_PUBLIC_SUPABASE_URL:PRODUCTION_URL,MP_BASE_URL:'https://tp-pw-rugolo.vercel.app'};
 assert.equal(checkoutEnvironment(prod),null);
 const enabled={...prod,MP_DEMO_PRODUCTION_ENABLED:'true'};
 assert.equal(checkoutEnvironment(enabled).webhook,PRODUCTION_URL+'/functions/v1/mercadopago-webhook');
 assert.equal(checkoutEnvironment({...enabled,VERCEL_ENV:'preview'}),null);
 assert.equal(demoEnvironment(PRODUCTION_URL),null);
 assert.equal(demoEnvironment('https://unknown.supabase.co','true'),null);
});
