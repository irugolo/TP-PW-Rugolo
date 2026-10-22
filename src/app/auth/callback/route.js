import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';
function redirect(path, origin) {
 const response = NextResponse.redirect(new URL(path, origin));
 response.headers.set('Cache-Control', 'private, no-store');
 response.headers.set('Referrer-Policy', 'no-referrer');
 return response;
}
export async function GET(request) {
 const url = new URL(request.url); const code = url.searchParams.get('code');
 const origin = process.env.APP_ORIGIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
 if (code) {
  try { const db = await supabaseServer(); const { data, error } = await db.auth.exchangeCodeForSession(code);
   if (!error) return redirect((data?.redirectType === 'recovery' || url.searchParams.get('next') === 'recovery') ? '/auth?mode=recovery' : '/mi-cuenta', origin);
  } catch { /* Invalid or unavailable auth: return a controlled error. */ }
 }
 return redirect('/auth?error=link', origin);
}
