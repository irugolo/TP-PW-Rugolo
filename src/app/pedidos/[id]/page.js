import {notFound,redirect} from 'next/navigation';
import {z} from 'zod';
import {identity} from '../../../lib/access';
import OrderActions from '../../../components/OrderActions';
export const dynamic='force-dynamic';
const states={pendiente:'Estamos verificando tu pago. Si todavía no pagaste, podés abrir el checkout.',pagado:'Pago de prueba aprobado y cupos confirmados.',rechazado:'El intento fue rechazado o cancelado. Podés volver al checkout.',reembolsado:'Pago reembolsado; no hay cupos asignados.',revision:'Pago recibido con una incidencia de cupos o más de un pago aprobado. El administrador debe revisar el pedido; no se emitirán reservas adicionales.'};
export default async function Order({params}){
 const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();let account;try{account=await identity();}catch{redirect('/auth');}
 const {data:o,error}=await account.db.from('pedidos_demo').select('*').eq('id',id).maybeSingle();if(error)return <section className="seccion"><h1>Pedido</h1><p role="alert">No se pudo consultar el pedido.</p></section>;if(!o)notFound();
 const {data:payments}=await account.db.from('pagos_demo').select('id,estado,importe').eq('pedido_id',id);
 return <section className="seccion"><h1>Pedido de prueba</h1><h2>{o.nombre}</h2><p>{o.descripcion}</p><dl><dt>Entradas</dt><dd>{o.cantidad}</dd><dt>Total</dt><dd>{Number(o.total).toLocaleString('es-AR')} ARS de prueba</dd></dl><p role="status">{states[o.estado]}</p>{o.propietario===account.user.id&&<OrderActions order={{id:o.id,estado:o.estado}}/>}<h2>Intentos de pago</h2>{payments?.length?<ul>{payments.map(p=><li key={p.id}>{p.estado} — {Number(p.importe).toLocaleString('es-AR')} ARS de prueba</li>)}</ul>:<p>Aún no hay pagos recibidos.</p>}</section>;
}
