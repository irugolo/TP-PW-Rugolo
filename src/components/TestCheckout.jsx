'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
export default function TestCheckout({experience,ready=false}){
 const router=useRouter();
 const [quantity,setQuantity]=useState(1),[busy,setBusy]=useState(false),[message,setMessage]=useState('');const key=useRef(null),lock=useRef(false);
 async function submit(event){event.preventDefault();if(lock.current||!ready)return;lock.current=true;setBusy(true);setMessage('Creando pedido de prueba…');key.current ||= crypto.randomUUID();
 try{const response=await fetch('/api/pedidos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({experiencia:experience.id,cantidad:Number(quantity),clave:key.current}),signal:AbortSignal.timeout(15000)});const result=await response.json();if(!response.ok){setMessage(response.status===401?'Iniciá sesión desde Mi cuenta para continuar.':result.error||'No se pudo crear el pedido.');return;}router.push('/pedidos/'+result.data.id);}catch{setMessage('Error de red. Conservamos tu selección; podés reintentar.');}finally{lock.current=false;setBusy(false);}}
 const valid=Number.isInteger(Number(quantity)) && Number(quantity)>=1 && Number(quantity)<=10;
 const money=value=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(value);
 return <section className="compra-panel" aria-labelledby="entradas-titulo">
  <div className="compra-cabecera"><h2 id="entradas-titulo">Elegí tus entradas</h2><span className="compra-etiqueta">Demostración</span></div>
  <p className="compra-precio">{money(experience.precio)} <span>ARS por persona</span></p>
  <form onSubmit={submit} aria-busy={busy}>
   <div className="compra-seleccion"><div><label htmlFor="cantidad">Cantidad de entradas</label><input id="cantidad" type="number" min="1" max="10" step="1" required value={quantity} disabled={busy||!ready} aria-describedby="cantidad-ayuda" onChange={e=>{setQuantity(e.target.value);key.current=null;}}/><small id="cantidad-ayuda">De 1 a 10 personas</small></div>
   <div className="compra-total"><span>Total estimado</span><strong>{valid?money(Number(quantity)*Number(experience.precio)):'—'}</strong><small>ARS · Importe confirmado al crear el pedido</small></div></div>
   <button className="boton principal" disabled={busy||!ready||!valid}>{busy?'Creando pedido…':'Ver resumen del pedido'}</button>
   <p className="compra-ayuda">Usá exclusivamente una cuenta compradora y tarjetas de prueba de Mercado Pago.</p>
   {!ready && <p role="alert">Checkout no disponible: falta verificar la configuración de prueba. Intentá más tarde.</p>}
   <p role="status">{message}</p>
  </form>
 </section>;
}
