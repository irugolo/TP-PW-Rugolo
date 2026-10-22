export function configured() { return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); }
export function config() {
 if (!configured()) throw new Error('Supabase no está configurado.');
 return [process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY];
}

// Browser Auth needs readable cookies to refresh sessions; do not force HttpOnly.
export function sessionCookieOptions(secure = process.env.NODE_ENV === 'production') {
 return { path: '/', sameSite: 'lax', secure, httpOnly: false };
}
