import 'server-only';
import { supabaseServer } from './supabase/server';
export async function catalog(id) {
 const db = await supabaseServer();
 let query = db.from('experiencias').select('*').eq('estado', 'publicado').order('nombre');
 if (id) query = query.eq('id', id);
 const { data, error } = await query;
 if (error) throw new Error('No se pudo cargar el catálogo.');
 return data;
}
