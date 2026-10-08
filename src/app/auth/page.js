import AuthForm from '../../components/AuthForm';
import { configured } from '../../lib/supabase/config';
export default async function AuthPage({searchParams}) {
 const query = await searchParams;
 if (!configured()) return <section className="seccion"><h1>Tu cuenta</h1><p role="alert">El acceso a cuentas todavía no está disponible.</p></section>;
 return <>{query.error && <p className="seccion" role="alert">El enlace venció o no es válido. Solicitá uno nuevo.</p>}<AuthForm recovery={query.mode === 'recovery'} /></>;
}
