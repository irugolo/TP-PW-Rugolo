import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
let error=null, redirectType=null;
mock.module('../src/lib/supabase/server.js',{namedExports:{supabaseServer:async()=>({auth:{exchangeCodeForSession:async()=>({error,data:{redirectType}})}})}});
const {GET}=await import('../src/app/auth/callback/route.js');
process.env.APP_ORIGIN='https://preview.example';
test('callback PKCE: destinos fijos, enlace inválido y sin caché/referrer',async()=>{
 for(const [query,path] of [['','/auth?error=link'],['?code=fake&next=https://evil.example','/mi-cuenta'],['?code=fake&next=recovery','/auth?mode=recovery']]){
  const r=await GET(new Request('https://host-no-confiable.example/auth/callback'+query));
  assert.equal(r.headers.get('location'),'https://preview.example'+path);
  assert.match(r.headers.get('cache-control'),/no-store/);assert.equal(r.headers.get('referrer-policy'),'no-referrer');
 }
 error=new Error('expired secret');const r=await GET(new Request('https://preview.example/auth/callback?code=fake'));
 assert.equal(r.headers.get('location'),'https://preview.example/auth?error=link');
});

test('callback reconoce recuperación del SDK aunque falte next',async()=>{
 error=null;redirectType='recovery';
 const r=await GET(new Request('https://preview.example/auth/callback?code=fake'));
 assert.equal(r.headers.get('location'),'https://preview.example/auth?mode=recovery');
});
