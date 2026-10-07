// Credentials arrive through stdin from the user's hidden terminal prompts.
// Do not invoke this with passwords in command arguments or debug logging.
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const logins = [];
let phase = 'configuración';
try {
  if (url !== 'https://kulvagylilutnpckpiuw.supabase.co' || !key) throw new Error('config');
  process.env.TEST_ORIGIN = 'http://localhost:3000';
  delete process.env.TEST_VERCEL_BYPASS_SECRET;
  const response = await fetch(`${process.env.TEST_ORIGIN}/auth`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('server');
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const accounts = JSON.parse(input);
  input = '';
  for (const [kind, role] of [['CLIENT', 'cliente'], ['ADMIN', 'admin']]) {
    phase = `inicio de sesión y rol ${role}`;
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.auth.signInWithPassword(accounts[kind]);
    delete accounts[kind];
    if (error || !data.session || !data.user.email_confirmed_at) throw new Error('login');
    logins.push(db);
    const profile = await db.from('perfiles').select('rol').eq('id', data.user.id).single();
    if (profile.error || profile.data.rol !== role) throw new Error('role');
    process.env[`TEST_${kind}_ACCESS_TOKEN`] = data.session.access_token;
    process.env[`TEST_${kind}_REFRESH_TOKEN`] = data.session.refresh_token;
  }
  phase = 'pruebas HTTP, persistencia y RLS';
  await import('./verify-remote.mjs');
  console.log('Prueba autenticada completada con sesiones normales.');
} catch {
  console.error(`No se completó la etapa: ${phase}. Revisá las cuentas, el servidor local y su configuración.`);
  process.exitCode = 1;
} finally {
  // Revoke only sessions created by this runner, not the user's browser session.
  for (const db of logins) {
    try {
      const { error } = await db.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch {
      console.error('No se pudo revocar una sesión de prueba; no se guardó su token en archivos.');
      process.exitCode = 1;
    }
  }
  for (const kind of ['CLIENT', 'ADMIN']) {
    delete process.env[`TEST_${kind}_ACCESS_TOKEN`];
    delete process.env[`TEST_${kind}_REFRESH_TOKEN`];
  }
}
