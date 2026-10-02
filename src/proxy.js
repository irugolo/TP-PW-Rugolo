import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { config as credentials, configured } from './lib/supabase/config';
export async function proxy(request) {
 let response = NextResponse.next({ request });
 if (!configured()) return response;
 const supabase = createServerClient(...credentials(), { cookies: {
  getAll: () => request.cookies.getAll(),
  setAll(items) {
   items.forEach(({ name, value }) => request.cookies.set(name, value));
   response = NextResponse.next({ request });
   items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  }
 } });
 await supabase.auth.getClaims();
 response.headers.set('Cache-Control', 'private, no-store');
 return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'] };
