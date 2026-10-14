'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
export default function OrderActions({order}){
 const router=useRouter(),lock=useRef(false),last=useRef(0);const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function checkout(){if(lock.current)return;lock.current=true;setBusy(true);setMessage('Preparando Checkout Pro de prueba…');try{const response=await fetch(`/api/pedidos/${order.id}/checkout`,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(20000)});const result=await response.json();if(!response.ok){setMessage(result.error||'No se pudo abrir el checkout.');return;}window.location.assign(result.url);}catch{setMessage('No pudimos confirmar la respuesta. Reintentá; se reutilizará el mismo pedido.');}finally{lock.current=false;setBusy(false);}}
 return <div className="data-form" aria-busy={busy}>{['pendiente','rechazado'].includes(order.estado)&&<button disabled={busy} onClick={checkout}>Ir a Mercado Pago — prueba</button>}<button disabled={busy} onClick={()=>{if(Date.now()-last.current<10000){setMessage('Esperá 10 segundos antes de volver a consultar.');return;}last.current=Date.now();router.refresh();setMessage('Estado solicitado. El retorno de Mercado Pago no confirma el pago.');}}>Actualizar estado</button><p role="status">{message}</p></div>;
}
