import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';
export async function GET(request) {
 const url = new URL(request.url); const code = url.searchParams.get('code');
 const origin = process.env.APP_ORIGIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
 if (code) {
  try { const db = await supabaseServer(); const { error } = await db.auth.exchangeCodeForSession(code);
   if (!error) return NextResponse.redirect(new URL(url.searchParams.get('next') === 'recovery' ? '/auth?mode=recovery' : '/mi-cuenta', origin));
  } catch { /* Invalid or unavailable auth: return a controlled error. */ }
 }
 return NextResponse.redirect(new URL('/auth?error=link', origin));
}
