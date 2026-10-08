import { JSDOM } from 'jsdom';
import React from 'react';
import { test, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
const dom = new JSDOM('<!doctype html><html lang="es"><body></body></html>', {url:'http://localhost:3000'});
for (const key of ['window','document','HTMLElement','HTMLInputElement','Node','MutationObserver','FormData']) globalThis[key] = dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.React = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = callback => setTimeout(callback,0);
const {render,fireEvent,screen,waitFor,cleanup} = await import('@testing-library/react');
const {default:DataForm,emptyExperience} = await import('../../src/components/DataForm.jsx');
const {default:AdminPanel} = await import('../../src/components/AdminPanel.jsx');
const {experiencias} = await import('../../src/data/experiencias.js');
const originalFetch = globalThis.fetch;
afterEach(() => {cleanup();globalThis.fetch=originalFetch;});
const submit = () => fireEvent.submit(screen.getByRole('button',{name:'Guardar cambios'}).closest('form'));
test('campos vacíos: errores asociados, foco y ningún envío', async () => {
 let calls=0;globalThis.fetch=async()=>{calls++;};
 render(<DataForm initial={emptyExperience}/>);submit();
 await waitFor(()=>assert.ok(document.activeElement === screen.getByLabelText('Identificador URL')));
 assert.equal(calls,0);assert.equal(screen.getByRole('group',{name:'Compañía'}).getAttribute('aria-invalid'),'true');
 for(const input of document.querySelectorAll('[aria-invalid="true"]')) assert.ok(document.getElementById(input.getAttribute('aria-describedby')).textContent);
});
for(const failure of ['offline','timeout','invalid-json','server']) test(`perfil ${failure}: conserva texto, termina carga y permite reintento`,async()=>{
 const initial={nombre:'Ana',telefono:'123'};let resolve;
 globalThis.fetch=()=>new Promise(r=>{resolve=r;});
 render(<DataForm initial={initial} profile/>);
 fireEvent.change(screen.getByLabelText('Nombre'),{target:{value:'Isabel prueba'}});submit();
 assert.equal(screen.getByRole('button',{name:'Guardando…'}).disabled,true);
 if(failure==='offline'||failure==='timeout') resolve(Promise.reject(new DOMException('simulated',failure==='timeout'?'TimeoutError':'NetworkError')));
 else resolve(failure==='invalid-json'?new Response('bad'):Response.json({error:'No se pudo guardar.'},{status:500}));
 await waitFor(()=>assert.equal(screen.getByRole('button',{name:'Guardar cambios'}).disabled,false));
 assert.equal(screen.getByLabelText('Nombre').value,'Isabel prueba');assert.match(screen.getByRole('status').textContent,/Error de red|No se pudo guardar/);
 assert.equal(screen.getByRole('button',{name:'Guardar cambios'}).closest('form').getAttribute('aria-busy'),'false');
 globalThis.fetch=async()=>Response.json({data:{...initial,nombre:'Isabel prueba'}});submit();
 await waitFor(()=>assert.match(screen.getByRole('status').textContent,/Cambios guardados/));
});
test('respuesta 422: error asociado al campo y valores conservados',async()=>{
 globalThis.fetch=async()=>Response.json({error:'Revisá los campos indicados.',fields:{telefono:'Ingresá un teléfono válido.'}},{status:422});
 render(<DataForm initial={{nombre:'Ana',telefono:'123'}} profile/>);submit();
 await waitFor(()=>assert.ok(document.activeElement === screen.getByLabelText('Teléfono (opcional)')));
 assert.equal(screen.getByLabelText('Teléfono (opcional)').value,'123');assert.equal(screen.getByLabelText('Teléfono (opcional)').getAttribute('aria-invalid'),'true');
});
test('eliminación fallida: foco, reintento y cancelación sin perder la experiencia',async()=>{
 const item={...experiencias[0],estado:'borrador'};globalThis.fetch=async()=>{throw new TypeError('offline');};
 render(<AdminPanel initial={[item]} metrics={{clientes:1}}/>);
 const trigger=screen.getByRole('button',{name:`Eliminar ${item.nombre}`});fireEvent.click(trigger);
 await waitFor(()=>assert.ok(document.activeElement === screen.getByRole('heading',{name:`¿Eliminar ${item.nombre}?`})));
 fireEvent.click(screen.getByRole('button',{name:'Confirmar eliminación'}));
 await waitFor(()=>assert.match(screen.getByRole('status').textContent,/Error de red/));
 assert.equal(screen.getByRole('button',{name:'Confirmar eliminación'}).disabled,false);
 fireEvent.click(screen.getByRole('button',{name:'Cancelar'}));await waitFor(()=>assert.ok(document.activeElement === trigger));assert.ok(screen.getByText(item.nombre));
});

let authCall;
mock.module('next/navigation',{namedExports:{useRouter:()=>({replace(){},refresh(){}})}});
mock.module('../../src/lib/supabase/browser.js',{namedExports:{supabaseBrowser:()=>({auth:{signInWithPassword:(...args)=>authCall(...args),signUp:(...args)=>authCall(...args),resetPasswordForEmail:(...args)=>authCall(...args),updateUser:(...args)=>authCall(...args)}})}});
const {default:AuthForm}=await import('../../src/components/AuthForm.jsx');
for(const mode of ['Ingresar','Registrarme','Recuperar contraseña']) test(`auth ${mode}: desconexión libera carga, conserva datos y permite reintentar`,async()=>{
 authCall=async()=>{throw new TypeError('offline');};render(<AuthForm/>);
 fireEvent.click(screen.getByRole('button',{name:mode}));
 fireEvent.change(screen.getByLabelText('Email'),{target:{value:'test@example.com'}});
 const password=document.getElementById('password');if(password)fireEvent.change(password,{target:{value:'only-fake-test-password'}});
 const form=screen.getByRole('button',{name:'Continuar'}).closest('form');fireEvent.submit(form);
 await waitFor(()=>assert.match(screen.getByRole('status').textContent,/No se pudo conectar/));
 assert.equal(form.getAttribute('aria-busy'),'false');assert.equal(screen.getByRole('button',{name:'Continuar'}).disabled,false);
 assert.equal(screen.getByLabelText('Email').value,'test@example.com');if(password)assert.equal(password.value,'only-fake-test-password');
 let attempts=0;authCall=async()=>{attempts++;return {error:null};};fireEvent.submit(form);
 await waitFor(()=>assert.equal(form.getAttribute('aria-busy'),'false'));assert.equal(attempts,1);
});
test('auth HTML: vacíos, email inválido y límites declarados',()=>{
 render(<AuthForm/>);fireEvent.click(screen.getByRole('button',{name:'Registrarme'}));
 const email=screen.getByLabelText('Email'),password=document.getElementById('password');
 assert.equal(email.checkValidity(),false);fireEvent.change(email,{target:{value:'incorrecto'}});assert.equal(email.checkValidity(),false);
 assert.equal(password.required,true);assert.equal(password.minLength,12);assert.equal(password.maxLength,128);
});
