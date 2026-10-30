import OrderRefresh from '../../../components/OrderRefresh';
import Link from 'next/link';
import {testCheckoutReady} from '../../../lib/mp-server';
import {orderStatus} from '../../../lib/order-status';
import {notFound,redirect} from 'next/navigation';
import {z} from 'zod';
import {identity} from '../../../lib/access';
import OrderActions from '../../../components/OrderActions';
export const dynamic='force-dynamic';
export default async function Order({params}){
 const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();let account;try{account=await identity();}catch{redirect('/auth');}
 const {data:o,error}=await account.db.from('pedidos_demo').select('*').eq('id',id).maybeSingle();if(error)return <section className="seccion"><h1>Pedido</h1><p role="alert">No se pudo consultar el pedido.</p></section>;if(!o)notFound();
 const {data:payments}=await account.db.from('pagos_demo').select('id,estado,importe').eq('pedido_id',id);
 const {data:plan}=await account.db.from('experiencias').select('zona,duracion,incluye').eq('id',o.experiencia_id).maybeSingle();
 const confirmed=o.estado==='pagado' && o.cupos_asignados;
 const status=orderStatus(o,payments||[]);
 const ready=o.propietario===account.user.id && ['pendiente','rechazado'].includes(o.estado) && await testCheckoutReady();
 const money=value=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(value);
 return <section className="seccion pedido-pagina">
  <Link className="volver" href={'/experiencias/'+o.experiencia_id}>← Volver a la experiencia</Link>
  <header className="pedido-cabecera"><p className="eyebrow">Compra directa · Demostración</p><h1>{confirmed?'Tu reserva confirmada':'Tu reserva'}</h1><p>{confirmed?'Guardá los detalles de tu plan.':'Revisá tus entradas y el estado de pago.'}</p></header>
  <OrderRefresh active={o.estado==='pendiente' && !!o.preferencia_id}/><div className="pedido-grilla"><div className="pedido-detalle"><h2>{o.nombre}</h2><p>{o.descripcion}</p>
   <section className={'pedido-estado'+(confirmed?' pedido-estado-exito':'')} aria-label="Estado del pedido" role="status"><h3>{status.title}</h3><p>{status.description}</p></section>
   <p className="compra-ayuda" hidden={confirmed}>En Mercado Pago, usá una sesión separada con tu comprador de prueba y medios de pago de prueba. No uses tu cuenta ni tus tarjetas personales.</p>
   <section className="reserva-detalles" aria-labelledby="reserva-detalles-titulo"><h2 id="reserva-detalles-titulo">Detalles de la reserva</h2><dl>
    <div><dt>Número de pedido</dt><dd className="reserva-codigo">{o.id}</dd></div>
    <div><dt>Personas</dt><dd>{o.cantidad}</dd></div>
    <div><dt>Pedido creado</dt><dd>{new Intl.DateTimeFormat('es-AR',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Argentina/Buenos_Aires'}).format(new Date(o.created_at))}</dd></div>
    {plan && <><div><dt>Zona del plan</dt><dd>{plan.zona}</dd></div><div><dt>Duración</dt><dd>{plan.duracion}</dd></div></>}
   </dl>{plan?.incluye?.length>0 && <><h3>Qué incluye el plan</h3><ul>{plan.incluye.map((item,i)=><li key={i}>{item}</li>)}</ul></>}<p className="compra-ayuda">Reserva de demostración: no corresponde a un evento, fecha o sede reales. Zona e inclusiones muestran la información actual del plan.</p></section>
   <section className="pedido-pagos"><h2>Intentos de pago</h2>{payments?.length?<ul>{payments.map(p=><li key={p.id}>{p.estado} · {money(p.importe)} ARS</li>)}</ul>:<p>Aún no hay pagos recibidos.</p>}</section>
  </div><aside className="pedido-resumen" aria-label="Importe del pedido"><h2>Tus entradas</h2><dl><div><dt>Precio por persona</dt><dd>{money(o.precio)}</dd></div><div><dt>Cantidad</dt><dd>{o.cantidad}</dd></div><div className="pedido-total"><dt>Total ARS</dt><dd>{money(o.total)}</dd></div></dl>
   {o.propietario===account.user.id&&<OrderActions ready={ready} order={{id:o.id,estado:o.estado}}/>}
   <p className="compra-ayuda">El regreso desde Mercado Pago no confirma el pago. El estado se actualiza al verificarlo en el servidor.</p>
  </aside></div>
 </section>;
}
