import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {experiencias} from '../src/data/experiencias.js';
let writes=0;
mock.module('../src/lib/access.js',{namedExports:{identity:async()=>({user:{id:'test-user'},db:{from(){writes++;throw new Error('No debe acceder a la base');}}})}});
const {PATCH:profile}=await import('../src/app/api/perfil/route.js');
const {POST:create}=await import('../src/app/api/experiencias/route.js');
const {PATCH:update}=await import('../src/app/api/experiencias/[id]/route.js');
const origin='http://localhost:3000';process.env.APP_ORIGIN=origin;
const request=(body,method='PATCH')=>new Request(origin+'/api/test',{method,headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
test('Route Handlers rechazan vacíos, formatos y rangos antes de persistir (identidad simulada)',async()=>{
 for(const body of [{nombre:'',telefono:''},{nombre:' '.repeat(2),telefono:''},{nombre:'a'.repeat(81),telefono:''},{nombre:'Ana',telefono:'abc@'},{nombre:'Ana',telefono:'1'.repeat(31)}]) {
  const response=await profile(request(body));assert.equal(response.status,422);assert.ok(Object.keys((await response.json()).fields).length);
 }
 const valid={...experiencias[0],estado:'borrador'};
 const changes=[{id:''},{id:'ID INVALIDO'},{nombre:''},{categoria:''},{descripcion:''},{detalle:''},{zona:''},{duracion:''},{alt:''},{precio:-0.01},{precio:10000000.01},{precio:0.001},{precio:'3'},{filtros:[]},{incluye:[]},{estado:'otro'}];
 for(const change of changes) for(const handler of [create,update]) {
  const response=await handler(request({...valid,...change},handler===create?'POST':'PATCH'),{params:Promise.resolve({id:valid.id})});
  assert.equal(response.status,422,JSON.stringify(change));assert.ok(Object.keys((await response.json()).fields).length);
 }
 assert.equal(writes,0);
});
