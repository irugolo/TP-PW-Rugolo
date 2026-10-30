import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { config, sessionCookieOptions } from './config';
export async function supabaseServer() {
 const jar = await cookies();
 return createServerClient(...config(), { cookieOptions: sessionCookieOptions(), cookies: { getAll: () => jar.getAll(), setAll(items) {
  try { items.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* Server Components: proxy writes refreshed cookies. */ }
 } } });
}
