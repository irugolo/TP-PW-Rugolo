import Link from 'next/link';
import { redirect } from 'next/navigation';
import { identity } from '../../lib/access';
import { configured } from '../../lib/supabase/config';
import DataForm from '../../components/DataForm';
import { SignOut } from '../../components/AuthForm';
export const dynamic = 'force-dynamic';
export default async function Account() {
 if (!configured()) redirect('/auth');
 let session;
 try { session = await identity(); } catch (error) { if (error.status === 401) redirect('/auth'); return <section className="seccion"><p role="alert">No se pudo cargar tu cuenta.</p></section>; }
 return <section className="seccion cuenta"><h1>Mi cuenta</h1><p>{session.user.email}</p>{session.profile.rol === 'admin' && <Link href="/admin">Administrar experiencias →</Link>}<DataForm profile initial={session.profile} /><SignOut /></section>;
}
