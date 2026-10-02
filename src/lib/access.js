import 'server-only';
import { supabaseServer } from './supabase/server';
export async function identity(admin = false) {
 const db = await supabaseServer();
 const { data: { user }, error } = await db.auth.getUser();
 if (error || !user) throw Object.assign(new Error('Iniciá sesión para continuar.'), { status: 401 });
 const { data: profile, error: profileError } = await db.from('perfiles').select('*').eq('id', user.id).single();
 if (profileError) throw new Error('No se pudo consultar el perfil.');
 if (admin && profile.rol !== 'admin') throw Object.assign(new Error('Acceso exclusivo para administradores.'), { status: 403 });
 return { db, user, profile };
}
