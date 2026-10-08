// Preview-only fixture setup via CLI. All security assertions use the public key.
// Creates no users and sends no emails. Removes only its two unique test IDs.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { experiencias } from '../src/data/experiencias.js';

const project = 'kulvagylilutnpckpiuw';
assert.equal(readFileSync('supabase/.temp/project-ref', 'utf8').trim(), project);
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, `https://${project}.supabase.co`);
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const id = `e3-rls-${randomUUID()}`;
const insertedId = `${id}-i`;
function sql(query) {
  const result = JSON.parse(execFileSync('npx', ['supabase', 'db', 'query', '--linked', '--output-format', 'json', query], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000,
  }));
  assert.ok(!result.error, 'La consulta de preparación o limpieza falló.');
  return result.rows;
}
try {
  sql(`insert into public.experiencias (id,nombre,categoria,descripcion,detalle,zona,duracion,precio,filtros,imagen,alt,incluye,estado)
    select '${id}',nombre,categoria,descripcion,detalle,zona,duracion,precio,filtros,imagen,alt,incluye,'borrador'
    from public.experiencias where id='juegos';`);
  assert.equal(sql(`select count(*)::int as n from public.experiencias where id='${id}';`)[0].n, 1);
  const hidden = await db.from('experiencias').select('id').eq('id', id);
  assert.equal(hidden.error, null);
  assert.deepEqual(hidden.data, [], 'RLS debe ocultar un borrador que existe realmente.');
  for (const result of [
    await db.from('experiencias').insert({ ...experiencias[0], id: insertedId, estado: 'publicado' }),
    await db.from('experiencias').update({ nombre: 'Cambio no autorizado' }).eq('id', id),
    await db.from('experiencias').delete().eq('id', id),
  ]) assert.equal(result.error?.code, '42501', 'Anónimo debe recibir permission denied.');
  assert.equal(sql(`select count(*)::int as n from public.experiencias where id='${id}' and nombre='Noche de juegos y pizza';`)[0].n, 1);
  console.log('OK: borrador remoto existente oculto; INSERT/UPDATE/DELETE anónimos rechazados con 42501.');
} finally {
  sql(`delete from public.experiencias where id in ('${id}','${insertedId}');`);
  assert.equal(sql(`select count(*)::int as n from public.experiencias where id in ('${id}','${insertedId}');`)[0].n, 0);
  console.log('Fixtures temporales eliminados y ausencia comprobada.');
}
