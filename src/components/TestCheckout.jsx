'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
export default function TestCheckout({experience}){
 const router=useRouter();
 const [quantity,setQuantity]=useState(1),[busy,setBusy]=useState(false),[message,setMessage]=useState('');const key=useRef(null),lock=useRef(false);
 async function submit(event){event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setMessage('Creando pedido de prueba…');key.current ||= crypto.randomUUID();
 try{const response=await fetch('/api/pedidos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({experiencia:experience.id,cantidad:Number(quantity),clave:key.current}),signal:AbortSignal.timeout(15000)});const result=await response.json();if(!response.ok){setMessage(response.status===401?'Iniciá sesión desde Mi cuenta para continuar.':result.error||'No se pudo crear el pedido.');return;}router.push('/pedidos/'+result.data.id);}catch{setMessage('Error de red. Conservamos tu selección; podés reintentar.');}finally{lock.current=false;setBusy(false);}}
 return <section className="data-form" aria-label="Pedido de demostración"><h2>Entradas de prueba</h2><p>Demostración: solo pagos con cuentas y tarjetas de prueba. Los cupos se confirman al aprobarse el pago.</p><form onSubmit={submit} aria-busy={busy}><label htmlFor="cantidad">Cantidad de entradas (1 a 10)</label><input id="cantidad" type="number" min="1" max="10" required value={quantity} disabled={busy} onChange={e=>{setQuantity(e.target.value);key.current=null;}}/><p>Total estimado: {(Number(quantity)*Number(experience.precio)).toLocaleString('es-AR')} ARS de prueba. El servidor confirma el importe.</p><button disabled={busy}>Ver resumen del pedido</button><p role="status">{message}</p></form></section>;
}
