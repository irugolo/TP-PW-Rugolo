import test from 'node:test';
import assert from 'node:assert/strict';
import { profileSchema, experienceSchema } from '../src/lib/validation.js';
import { experiencias } from '../src/data/experiencias.js';
import { checkOrigin, payload, failure } from '../src/lib/http.js';
const valid = {...experiencias[0], estado:'borrador'};
test('acepta los seis datos existentes y normaliza perfil', () => {
 for (const item of experiencias) assert.ok(experienceSchema.safeParse({...item,estado:'publicado'}).success);
 assert.deepEqual(profileSchema.parse({nombre:' Ana ',telefono:''}),{nombre:'Ana',telefono:''});
});
test('rechaza inyección de roles, IDs y atributos ajenos', () => {
 for (const extra of [{rol:'admin'},{id:'otro'},{created_at:'ayer'}]) assert.equal(profileSchema.safeParse({nombre:'Ana',telefono:'',...extra}).success,false);
 assert.equal(experienceSchema.safeParse({...valid,owner:'otra persona'}).success,false);
});
test('rechaza límites, tipos, valores no permitidos y arreglos malformados', () => {
 for (const change of [{precio:-1},{precio:'18'},{precio:Infinity},{precio:1.123},{precio:10000001},{nombre:' '},{id:'../privado'},{detalle:'a'.repeat(4001)},{filtros:[]},{filtros:['Con amigos','Con amigos']},{filtros:['cualquiera']},{incluye:['']},{incluye:Array(13).fill('x')},{estado:'eliminado'},{imagen:'https://malicioso.example/x'}]) assert.equal(experienceSchema.safeParse({...valid,...change}).success,false,JSON.stringify(change));
 assert.equal(profileSchema.safeParse({nombre:'Ana',telefono:'<script>'}).success,false);
});
test('origen y JSON obligatorios, incluso sin Origin', () => {
 const origin = process.env.APP_ORIGIN || 'http://localhost:3000';
 const req = headers => new Request(origin+'/api/perfil',{method:'PATCH',headers});
 assert.doesNotThrow(() => checkOrigin(req({origin,'content-type':'application/json'})));
 for(const value of ['https://evil.example','null','']) assert.throws(() => checkOrigin(req({origin:value,'content-type':'application/json'})), e=>e.status===403);
 assert.throws(() => checkOrigin(req({origin,'content-type':'text/plain'})),e=>e.status===415);
});
test('payload distingue JSON roto, tamaño excesivo y errores por campo',async () => {
 const req = body => new Request('http://localhost/api',{method:'POST',body});
 await assert.rejects(payload(req('{'),profileSchema),e=>e.status===400);
 await assert.rejects(payload(req('x'.repeat(20001)),profileSchema),e=>e.status===413);
 await assert.rejects(payload(req('{"nombre":"","telefono":""}'),profileSchema),e=>e.status===422 && Boolean(e.fields.nombre));
 assert.deepEqual(await payload(req('{"nombre":"Ana","telefono":""}'),profileSchema),{nombre:'Ana',telefono:''});
});
test('fallos inesperados no filtran detalles internos',async () => {
 const response = failure(new Error('secreto interno'));
 assert.equal(response.status,500); assert.ok(!(await response.text()).includes('secreto'));
});
