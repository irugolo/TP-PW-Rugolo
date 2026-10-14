import Link from 'next/link';
import {redirect} from 'next/navigation';
import {identity} from '../../lib/access';
export const dynamic='force-dynamic';
export default async function Orders(){
 let account;try{account=await identity();}catch{redirect('/auth');}
 const {data,error}=await account.db.from('pedidos_demo').select('id,nombre,cantidad,total,estado,created_at').order('created_at',{ascending:false}).limit(50);
 return <section className="seccion"><h1>{account.profile.rol==='admin'?'Pedidos de demostración':'Mis pedidos'}</h1><p>Solo pagos de prueba. Estos importes no son ingresos reales.</p>{error?<p role="alert">No se pudieron cargar los pedidos. Intentá más tarde.</p>:!data.length?<p>Todavía no hay pedidos.</p>:<ul>{data.map(o=><li key={o.id}><Link href={'/pedidos/'+o.id}>{o.nombre} — {o.cantidad} entradas — {o.estado}</Link><p>{Number(o.total).toLocaleString('es-AR')} ARS de prueba</p></li>)}</ul>}</section>;
}
