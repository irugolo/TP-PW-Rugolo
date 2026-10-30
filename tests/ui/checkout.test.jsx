import {JSDOM} from 'jsdom';
import React from 'react';
import {test,afterEach,mock} from 'node:test';
import assert from 'node:assert/strict';
const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost:3000'});
for(const key of ['window','document','HTMLElement','HTMLInputElement','Node','MutationObserver'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.React=React;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let refreshes=0;
const router={push(){},refresh(){refreshes++;}};
mock.module('next/navigation',{namedExports:{useRouter:()=>router}});
const {render,screen,fireEvent,waitFor,cleanup}=await import('@testing-library/react');
const {default:TestCheckout}=await import('../../src/components/TestCheckout.jsx');
const {default:OrderActions}=await import('../../src/components/OrderActions.jsx');
const originalFetch=globalThis.fetch;
afterEach(()=>{cleanup();globalThis.fetch=originalFetch;});
test('purchase blocked when configuration cannot be verified',()=>{
 let calls=0;globalThis.fetch=()=>{calls++;};
 render(<TestCheckout experience={{id:'juegos',precio:18000}} ready={false}/>);
 const button=screen.getByRole('button',{name:'Reservar plan'});
 assert.equal(button.disabled,true);fireEvent.submit(button.closest('form'));assert.equal(calls,0);
 cleanup();render(<OrderActions order={{id:'fixture',estado:'pendiente'}} ready={false}/>);
 assert.equal(screen.getByRole('button',{name:'Continuar a Mercado Pago'}).disabled,true);
});
test('quantity and selection survive network failure, loading ends and retry remains possible',async()=>{
 globalThis.fetch=async()=>{throw Error('offline');};
 render(<TestCheckout experience={{id:'juegos',precio:18000}} ready/>);
 const quantity=screen.getByLabelText('Cantidad de entradas');fireEvent.change(quantity,{target:{value:'2'}});
 fireEvent.submit(screen.getByRole('button',{name:'Reservar plan'}).closest('form'));
 await waitFor(()=>assert.match(screen.getByRole('status').textContent,/Error de red/));
 assert.equal(quantity.value,'2');assert.equal(screen.getByRole('button',{name:'Reservar plan'}).disabled,false);
});

test('pending return refresh is bounded and confirmed orders do not poll',async()=>{
 const {default:OrderRefresh}=await import('../../src/components/OrderRefresh.jsx');
 const originalSet=globalThis.setInterval,originalClear=globalThis.clearInterval;
 let callback,cleared=0,scheduled=0;
 Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
 globalThis.setInterval=fn=>{callback=fn;scheduled++;return 123;};
 globalThis.clearInterval=()=>{cleared++;};
 try{
  refreshes=0;render(<OrderRefresh active={false}/>);assert.equal(scheduled,0);cleanup();
  render(<OrderRefresh active/>);assert.equal(scheduled,1);
  for(let i=0;i<6;i++)callback();
  assert.equal(refreshes,6);assert.ok(cleared>0);cleanup();
 }finally{globalThis.setInterval=originalSet;globalThis.clearInterval=originalClear;}
});

test('cine para dos: cantidad fija y total visibles antes de reservar',()=>{
 render(<TestCheckout experience={{id:'plan-cine-para-dos',precio:48000,cantidad_fija:2}} ready/>);
 const quantity=screen.getByLabelText('Cantidad de entradas');assert.equal(quantity.value,'2');assert.equal(quantity.readOnly,true);assert.equal(quantity.min,'2');assert.equal(quantity.max,'2');assert.match(document.body.textContent,/96.000/);
});
