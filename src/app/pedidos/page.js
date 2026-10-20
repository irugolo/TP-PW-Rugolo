import Link from 'next/link';
import {redirect} from 'next/navigation';
import {identity} from '../../lib/access';
export const dynamic='force-dynamic';
const labels={pendiente:'Pendiente de pago',pagado:'Pago confirmado',rechazado:'Pago rechazado',reembolsado:'Reembolsado',revision:'En revisión'};
export default async function Orders(){
 let account;try{account=await identity();}catch{redirect('/auth');}
 const {data,error}=await account.db.from('pedidos_demo').select('id,nombre,cantidad,total,estado,created_at').order('created_at',{ascending:false}).limit(50);
 return <section className="seccion pedido-pagina"><h1>{account.profile.rol==='admin'?'Pedidos de demostración':'Mis pedidos'}</h1><p className="compra-ayuda">Tus reservas de demostración y su estado de pago.</p>{error?<p role="alert">No se pudieron cargar los pedidos. Intentá más tarde.</p>:!data.length?<p>Todavía no hay pedidos.</p>:<ul className="pedidos-lista">{data.map(o=><li key={o.id}><Link href={'/pedidos/'+o.id}><span className="pedido-lista-nombre">{o.nombre}</span><span className={'pedido-etiqueta '+(o.estado==='pagado'?'confirmado':'')}>{labels[o.estado]||'Estado no disponible'}</span><span>{o.cantidad} {o.cantidad===1?'entrada':'entradas'} · ${Number(o.total).toLocaleString('es-AR')} ARS</span><span className="pedido-lista-enlace">Ver reserva →</span></Link></li>)}</ul>}</section>;
}
