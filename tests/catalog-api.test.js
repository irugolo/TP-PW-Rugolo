import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {experiencias} from '../src/data/experiencias.js';
let rows=[],fail=false;
mock.module('../src/lib/catalog.js',{namedExports:{catalog:async()=>{if(fail)throw Error('private detail');return rows;}}});
mock.module('../src/lib/access.js',{namedExports:{identity:async()=>{throw Error('unused');}}});
const {GET:list}=await import('../src/app/api/experiencias/route.js');
const {GET:detail}=await import('../src/app/api/experiencias/[id]/route.js');
const req=q=>new Request('https://example.com/api/experiencias'+q);
test('API catálogo: vacíos, filtros, privados, parámetros y errores',async()=>{
 assert.deepEqual(await (await list(req(''))).json(),{data:[]});
 rows=[{...experiencias[0],estado:'publicado',created_at:'private'},{...experiencias[1],estado:'borrador'}];
 const data=(await (await list(req(''))).json()).data;assert.equal(data.length,1);assert.equal(data[0].created_at,undefined);assert.equal(data[0].estado,undefined);
 for(const q of ['?estado=borrador','?filtro=otro','?filtro=Con%20amigos&filtro=En%20pareja'])assert.equal((await list(req(q))).status,400);
 assert.equal((await detail(req(''),{params:Promise.resolve({id:experiencias[1].id})})).status,404);
 assert.equal((await detail(req(''),{params:Promise.resolve({id:'../bad'})})).status,400);
 assert.equal((await detail(req(''),{params:Promise.resolve({id:experiencias[0].id})})).status,200);
 fail=true;const response=await list(req(''));assert.equal(response.status,500);assert.ok(!(await response.text()).includes('private detail'));
});
