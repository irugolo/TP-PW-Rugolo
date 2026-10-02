import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// PostgreSQL real embebido, auth.uid emulado. No reemplaza sesiones Supabase remotas.
test('migraciones, restricciones y permisos RLS en PostgreSQL aislado',async t => {
 const db = new PGlite();
 const client = '11111111-1111-4111-8111-111111111111';
 const other = '22222222-2222-4222-8222-222222222222';
 const admin = '33333333-3333-4333-8333-333333333333';
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
 await db.exec(await readFile('supabase/migrations/20261001000100_schema.sql','utf8'));
 const seed = await readFile('supabase/migrations/20261001000200_demo.sql','utf8');
 await db.exec(seed);await db.exec(seed);
 await db.query('insert into auth.users values ($1,$4),($2,$4),($3,$4)',[client,other,admin,{rol:'admin'}]);
 assert.equal((await db.query('select count(*)::int n from public.experiencias')).rows[0].n,6);
 assert.ok((await db.query('select rol from public.perfiles')).rows.every(r=>r.rol==='cliente'));
 await db.query("update public.perfiles set rol='admin' where id=$1",[admin]);
 async function as(role,id,fn) {await db.exec(`set role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);try {await fn();}finally {await db.exec('reset role');}}
 await t.test('anónimo: publicados, sin perfiles, sin CRUD ni métricas',async()=>{
  await db.exec("update public.experiencias set estado='borrador' where id='juegos'");
  await as('anon',null,async()=>{
   assert.equal((await db.query('select * from public.experiencias')).rows.length,5);
   await assert.rejects(db.query('select * from public.perfiles'));
   await assert.rejects(db.query("delete from public.experiencias where id='cocina'"));
   await assert.rejects(db.query('select public.admin_metrics()'));
  });
 });
 await t.test('cliente: solo su perfil; no eleva rol ni toca catálogo',async()=>as('authenticated',client,async()=>{
  assert.deepEqual((await db.query('select id from public.perfiles')).rows,[{id:client}]);
  await db.query("update public.perfiles set nombre='Nombre editado' where id=$1",[client]);
  assert.equal((await db.query('select nombre from public.perfiles')).rows[0].nombre,'Nombre editado');
  assert.equal((await db.query("update public.perfiles set nombre='Intrusión' where id=$1 returning id",[other])).rows.length,0);
  await assert.rejects(db.query("update public.perfiles set rol='admin' where id=$1",[client]));
  await assert.rejects(db.query('insert into public.perfiles(id) values($1)',[other]));
  assert.equal((await db.query("update public.experiencias set estado='borrador' where id='cocina' returning id")).rows.length,0);
  assert.equal((await db.query("delete from public.experiencias where id='cocina' returning id")).rows.length,0);
  await assert.rejects(db.query('select public.admin_metrics()'));
 }));
 await t.test('admin: CRUD, reconsulta persistida y métricas agregadas',async()=>as('authenticated',admin,async()=>{
  assert.equal((await db.query('select * from public.experiencias')).rows.length,6);
  await db.exec("insert into public.experiencias(id,nombre,categoria,descripcion,detalle,zona,duracion,precio,filtros,imagen,alt,incluye,estado) select 'test-admin',nombre,categoria,descripcion,detalle,zona,duracion,precio,filtros,imagen,alt,incluye,'borrador' from public.experiencias where id='juegos'");
  await db.exec("update public.experiencias set nombre='Editado',estado='publicado' where id='test-admin'");
  assert.equal((await db.query("select nombre from public.experiencias where id='test-admin'")).rows[0].nombre,'Editado');
  assert.deepEqual((await db.query('select public.admin_metrics() as metrics')).rows[0].metrics,{total:7,publicadas:6,borradores:1,clientes:2});
  await assert.rejects(db.exec("update public.experiencias set precio=-1 where id='test-admin'"));
  await assert.rejects(db.exec("update public.experiencias set incluye=array[''] where id='test-admin'"));
  await assert.rejects(db.exec("update public.experiencias set id='renamed' where id='test-admin'"));
  await db.exec("delete from public.experiencias where id='test-admin'");
  assert.equal((await db.query("select * from public.experiencias where id='test-admin'")).rows.length,0);
 }));
 await db.close();
});
