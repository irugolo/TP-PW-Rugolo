// Run only against the authorized preview with existing, dedicated test sessions.
// No service key, signup, password reset, or email delivery is used.
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { experiencias } from '../src/data/experiencias.js';
const env = process.env;
for (const name of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','TEST_ORIGIN','TEST_CLIENT_ACCESS_TOKEN','TEST_CLIENT_REFRESH_TOKEN','TEST_ADMIN_ACCESS_TOKEN','TEST_ADMIN_REFRESH_TOKEN']) {
 if (!env[name]) throw new Error(`Falta ${name}; configurala localmente sin compartir su valor.`);
}
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const origin = new URL(env.TEST_ORIGIN).origin;
assert.ok(origin === env.TEST_ORIGIN, 'TEST_ORIGIN debe ser un origen exacto sin barra final.');
async function session(kind) {
 const cookies = new Map();
 const db = createServerClient(url,key,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:items=>items.forEach(({name,value})=>cookies.set(name,value))}});
 const {error} = await db.auth.setSession({access_token:env[`TEST_${kind}_ACCESS_TOKEN`],refresh_token:env[`TEST_${kind}_REFRESH_TOKEN`]});
 assert.ok(!error, `Sesión ${kind} inválida.`);
 const {data:{user},error:identityError} = await db.auth.getUser();assert.ok(!identityError && user);
 return {db,user,headers:()=>({cookie:[...cookies].map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('; ')})};
}
const anon = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const client = await session('CLIENT'), admin = await session('ADMIN');
assert.notEqual(client.user.id,admin.user.id);
const id = `e3-verificacion-${Date.now()}`;
async function call(path,method,body,actor,customOrigin=origin) {
 const response = await fetch(origin+path,{method,headers:{...actor?.headers(),origin:customOrigin,'content-type':'application/json'},body:body === undefined ? undefined : JSON.stringify(body),redirect:'manual'});
 return {response,data:await response.json()};
}
let created = false;
try {
 assert.equal((await call('/api/experiencias','POST',{},null)).response.status,401);
 assert.equal((await call('/api/experiencias','POST',{},client)).response.status,403);
 assert.equal((await call('/api/perfil','PATCH',{},client,'https://invalid.example')).response.status,403);
 assert.equal((await call('/api/perfil','PATCH',{nombre:'',telefono:''},client)).response.status,422);
 assert.equal((await call('/api/perfil','PATCH',{nombre:'Prueba',telefono:'',rol:'admin'},client)).response.status,422);
 for(const actor of [null,client]) {
  const response = await fetch(origin+'/admin',{headers:actor?.headers(),redirect:'manual'});
  const target = actor ? '/mi-cuenta' : '/auth';
  if (response.status === 307) assert.ok(response.headers.get('location')?.includes(target));
  else { assert.equal(response.status,200); const html = await response.text(); assert.ok(html.includes('id="__next-page-redirect"') && html.includes(`url=${target}`)); assert.ok(!html.includes('Agregar experiencia')); }
 }
 assert.ok((await client.db.from('perfiles').update({rol:'admin'}).eq('id',client.user.id)).error);
 const foreign = await client.db.from('perfiles').update({nombre:'No debe guardarse'}).eq('id',admin.user.id).select();
 assert.ok(foreign.error || foreign.data.length === 0);
 const profile = await client.db.from('perfiles').select('nombre,telefono').eq('id',client.user.id).single();assert.ok(!profile.error);
 assert.equal((await call('/api/perfil','PATCH',profile.data,client)).response.status,200);
 assert.deepEqual((await client.db.from('perfiles').select('nombre,telefono').eq('id',client.user.id).single()).data,profile.data);
 const draft = {...experiencias[0],id,estado:'borrador'};
 const denied = await client.db.from('experiencias').insert(draft);assert.ok(denied.error);
 assert.equal((await call('/api/experiencias','POST',draft,admin)).response.status,201);created=true;
 assert.equal((await anon.from('experiencias').select('id').eq('id',id)).data?.length,0);
 assert.equal((await client.db.from('experiencias').select('id').eq('id',id)).data?.length,0);
 const changed = {...draft,nombre:'Verificación temporal E3',estado:'publicado'};
 assert.equal((await call(`/api/experiencias/${id}`,'PATCH',changed,admin)).response.status,200);
 assert.equal((await admin.db.from('experiencias').select('nombre').eq('id',id).single()).data?.nombre,changed.nombre);
 assert.equal((await anon.from('experiencias').select('id').eq('id',id)).data?.length,1);
 const deniedDelete = await client.db.from('experiencias').delete().eq('id',id).select();assert.ok(deniedDelete.error || deniedDelete.data.length === 0);
 assert.ok((await client.db.rpc('admin_metrics')).error);assert.ok(!(await admin.db.rpc('admin_metrics')).error);
 console.log('OK: sesiones normales, Route Handlers, persistencia consultada nuevamente y RLS remota.');
} finally {
 if(created) {
  const result = await call(`/api/experiencias/${id}`,'DELETE',undefined,admin);
  assert.equal(result.response.status,200,`Limpiar manualmente la fila temporal ${id}.`);
  assert.equal((await admin.db.from('experiencias').select('id').eq('id',id)).data?.length,0);
 }
}
