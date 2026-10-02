import { redirect } from 'next/navigation';
import { identity } from '../../lib/access';
import { configured } from '../../lib/supabase/config';
import AdminPanel from '../../components/AdminPanel';
export const dynamic = 'force-dynamic';
export default async function Admin() {
 if (!configured()) redirect('/auth');
 let session;
 try { session = await identity(true); } catch (error) { if (error.status === 401) redirect('/auth'); if (error.status === 403) redirect('/mi-cuenta'); return <section className="seccion"><p role="alert">No se pudo verificar el acceso.</p></section>; }
 const [{data,error},metrics] = await Promise.all([session.db.from('experiencias').select('*').order('nombre'),session.db.rpc('admin_metrics')]);
 if (error || metrics.error) return <section className="seccion"><h1>Administración</h1><p role="alert">No se pudieron cargar los datos.</p></section>;
 return <AdminPanel initial={data} metrics={metrics.data} />;
}
