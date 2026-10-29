// Real PostgreSQL connections, Preview only. Synthetic rows are cleaned in finally.
import {Client} from 'pg';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const ref=(await readFile('supabase/.temp/project-ref','utf8')).trim();
if(ref!=='kulvagylilutnpckpiuw')throw Error('Solo Preview autorizado.');
const uri=new URL((await readFile('supabase/.temp/pooler-url','utf8')).trim());
if(!uri.hostname.endsWith('.pooler.supabase.com')||!decodeURIComponent(uri.username).includes(ref))throw Error('Pooler inesperado.');
const secret=(await readFile('.env.supabase-db','utf8')).split('\n').find(x=>x.startsWith('SUPABASE_DB_PASSWORD='))?.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g,'');
const config={host:uri.hostname,port:Number(uri.port)||5432,user:decodeURIComponent(uri.username),database:'postgres',password:secret,ssl:{rejectUnauthorized:true,ca:await readFile(process.env.SUPABASE_CA_CERT_PATH||'/tmp/fdp-supabase-ca.crt','utf8')},connectionTimeoutMillis:15000};
const clients=[];const user=randomUUID(),other=randomUUID(),experience='qa-'+randomUUID(),order1=randomUUID(),order2=randomUUID();const payment1='qa-'+randomUUID(),payment2='qa-'+randomUUID();
let root;
try{
 for(let i=0;i<3;i++){const c=new Client(config);await c.connect();clients.push(c);}root=clients[0];
 await root.query('insert into auth.users(id) values($1),($2)',[user,other]);
 await root.query("insert into public.experiencias(id,nombre,categoria,descripcion,detalle,zona,duracion,precio,filtros,imagen,alt,incluye,estado) values($1,'Fixture QA','QA','Fixture','Fixture','QA','1 hora',100,ARRAY['Con amigos'],'juegos','Fixture',ARRAY['Fixture'],'borrador')",[experience]);
 await root.query('insert into public.cupos_demo(experiencia_id,capacidad,ocupados) values($1,1,0)',[experience]);
 for(const [id,owner]of [[order1,user],[order2,other]])await root.query("insert into public.pedidos_demo(id,propietario,experiencia_id,clave,nombre,descripcion,cantidad,precio) values($1,$2,$3,$4,'Fixture','Fixture',1,100)",[id,owner,experience,randomUUID()]);
 const pay=(client,order,id)=>client.query("select public.conciliar_pago_demo($1,$2,'approved',now(),100,'ARS','fixture',false)",[order,id]);
 await Promise.all([pay(clients[1],order1,payment1),pay(clients[2],order2,payment2)]);
 const orders=(await root.query('select estado,cupos_asignados from public.pedidos_demo where id=any($1::uuid[])',[[order1,order2]])).rows;
 assert.deepEqual(orders.map(x=>x.estado).sort(),['pagado','revision']);
 assert.equal(orders.filter(x=>x.cupos_asignados).length,1);
 await Promise.all([pay(clients[1],order1,payment1),pay(clients[2],order1,payment1)]);
 assert.equal((await root.query('select ocupados from public.cupos_demo where experiencia_id=$1',[experience])).rows[0].ocupados,1);
 assert.equal((await root.query('select count(*)::int n from public.pagos_demo where id=any($1::text[])',[[payment1,payment2]])).rows[0].n,2);
 await assert.rejects(root.query('delete from public.experiencias where id=$1',[experience]),e=>e.code==='23503');
 // Real RLS policies with SQL role/session claims, not an HTTP Auth session.
 await clients[1].query('begin');await clients[1].query('set local role authenticated');
 await clients[1].query("select set_config('request.jwt.claim.sub',$1,true)",[user]);
 assert.equal((await clients[1].query('select id from public.pedidos_demo where id=$1',[order2])).rows.length,0);
 await clients[1].query('rollback');
 console.log('PASS Preview: 2 conexiones simultáneas, último cupo sin sobreventa, duplicados sin doble asignación, FK y RLS real. Pagos simulados en SQL; no se llamó a Mercado Pago.');
}catch(e){console.error('FAIL verificación:',e.code||e.name,'(detalles omitidos)');process.exitCode=1;}
finally{
 if(root){try{
  await root.query('delete from public.pagos_demo where pedido_id=any($1::uuid[])',[[order1,order2]]);
  await root.query('delete from public.pedidos_demo where id=any($1::uuid[])',[[order1,order2]]);
  await root.query('delete from public.cupos_demo where experiencia_id=$1',[experience]);
  await root.query('delete from public.experiencias where id=$1',[experience]);
  await root.query('delete from auth.users where id=any($1::uuid[])',[[user,other]]);
  console.log('Fixtures eliminados.');
 }catch{console.error('Revisar limpieza de fixtures',experience);process.exitCode=1;}}
 await Promise.all(clients.map(c=>c.end()));
}
