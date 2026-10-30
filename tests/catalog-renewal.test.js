import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { matchesFilters, readFilters } from '../src/lib/catalog-filters.js';
import { experienceSchema } from '../src/lib/validation.js';
const items=JSON.parse(await readFile('src/data/catalogo-renovado.json','utf8'));
test('23 propuestas completas, precios y filtros OR dentro / AND entre grupos',()=>{
 assert.equal(items.length,23);assert.equal(new Set(items.map(i=>i.id)).size,23);
 for(const {archivo,capacidad,...item} of items){assert.ok(archivo && capacidad);assert.ok(experienceSchema.safeParse(item).success,item.id);const words=item.detalle.split(/\s+/).length;assert.ok(words>=100&&words<=150);assert.ok(item.itinerario.length>=3&&item.itinerario.length<=4);}
 const filters=readFilters(new URLSearchParams({compania:'En pareja,Con amigos',ambiente:'Interior',momento:'Día'}));
 assert.ok(items.filter(i=>matchesFilters(i,filters)).every(i=>i.filtros.includes('Interior')&&i.filtros.includes('Día')));
 const cinema=items.find(i=>i.id==='plan-cine-para-dos');assert.equal(cinema.precio*cinema.cantidad_fija,96000);
});
test('migración conserva historial y ediciones; todos los planes reservables; cine exige dos incluso por RPC',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 const files=(await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort();
 for(const f of files.filter(f=>!f.includes('catalog_renewal')))await db.exec(await readFile('supabase/migrations/'+f,'utf8'));
 const user='11111111-1111-4111-8111-111111111111';await db.query('insert into auth.users values($1)',[user]);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
 const old=(await db.query("select * from public.crear_pedido_demo('juegos',1,gen_random_uuid())")).rows[0];
 await db.query("select public.conciliar_pago_demo($1,'historic-test','approved',now(),18000,'ARS','test-seller',false)",[old.id]);
 const migration=await readFile('supabase/migrations/20261030000100_catalog_renewal.sql','utf8');await db.exec(migration);
 assert.equal((await db.query("select count(*)::int n from experiencias where estado='publicado'")).rows[0].n,23);
 assert.equal((await db.query('select estado from pedidos_demo where id=$1',[old.id])).rows[0].estado,'pagado');
 assert.equal((await db.query("select ocupados from cupos_demo where experiencia_id='juegos'")).rows[0].ocupados,1);
 await assert.rejects(db.query("select public.crear_pedido_demo('juegos',1,gen_random_uuid())"));
 await assert.rejects(db.query("select public.crear_pedido_demo('plan-cine-para-dos',1,gen_random_uuid())"));
 await assert.rejects(db.query("update experiencias set cantidad_fija=1 where id='plan-cine-para-dos'"));
 for(const item of items){const uid=crypto.randomUUID();await db.query('insert into auth.users values($1)',[uid]);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.exec('set role authenticated');const order=(await db.query('select * from public.crear_pedido_demo($1,$2,gen_random_uuid())',[item.id,item.cantidad_fija||1])).rows[0];assert.equal(Number(order.total),item.precio*(item.cantidad_fija||1));await db.exec('reset role');}
 await db.exec("update experiencias set nombre='Edición posterior admin' where id='plan-cine-para-dos';update cupos_demo set ocupados=2 where experiencia_id='plan-cine-para-dos'");
 await db.exec(migration);
 assert.equal((await db.query("select nombre from experiencias where id='plan-cine-para-dos'")).rows[0].nombre,'Edición posterior admin');
 assert.equal((await db.query("select ocupados from cupos_demo where experiencia_id='plan-cine-para-dos'")).rows[0].ocupados,2);
 await assert.rejects(db.query("select public.crear_pedido_demo('plan-cine-para-dos',2,gen_random_uuid())"));
 }finally{await db.close();}
});
