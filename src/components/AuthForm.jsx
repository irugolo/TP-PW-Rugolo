 'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../lib/supabase/browser';
export default function AuthForm({ recovery = false }) {
 const [mode, setMode] = useState(recovery ? 'update' : 'login'); const [message,setMessage] = useState(''); const [busy,setBusy] = useState(false); const lock = useRef(false); const router = useRouter();
 async function submit(event) {
  event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setMessage('Procesando…');
  const form = new FormData(event.currentTarget); const email = String(form.get('email') || '').trim(); const password = String(form.get('password') || '');
  try {
   const db = supabaseBrowser(); const redirectTo = `${window.location.origin}/auth/callback`;
   let result;
   if (mode === 'login') result = await db.auth.signInWithPassword({email,password});
   if (mode === 'register') result = await db.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});
   if (mode === 'reset') result = await db.auth.resetPasswordForEmail(email,{redirectTo:`${redirectTo}?next=recovery`});
   if (mode === 'update') result = await db.auth.updateUser({password});
   if (result.error) { setMessage(mode === 'login' ? 'No pudimos iniciar sesión. Revisá tus datos y la confirmación de correo.' : 'No se pudo completar. Revisá los datos o solicitá un enlace nuevo.'); return; }
   if (mode === 'login' || mode === 'update') { router.replace('/mi-cuenta'); router.refresh(); }
   else setMessage('Si corresponde, recibirás un correo con los pasos para continuar. Revisá tu bandeja de entrada.');
  } catch { setMessage('No se pudo conectar. Intentá nuevamente.'); }
  finally { lock.current = false; setBusy(false); }
 }
 return <section className="seccion cuenta"><h1>{mode === 'update' ? 'Nueva contraseña' : 'Tu cuenta'}</h1>
 {!recovery && <div className="filtros" role="group" aria-label="Opciones de acceso">{[['login','Ingresar'],['register','Registrarme'],['reset','Recuperar contraseña']].map(([value,label]) => <button key={value} disabled={busy} aria-pressed={mode === value} onClick={() => {setMode(value);setMessage('');}}>{label}</button>)}</div>}
 <form className="data-form" onSubmit={submit} aria-busy={busy}>
 {mode !== 'update' && <div className="form-field"><label htmlFor="email">Email</label><input name="email" id="email" type="email" autoComplete="email" required maxLength={254} /></div>}
 {mode !== 'reset' && <div className="form-field"><label htmlFor="password">Contraseña{mode !== 'login' && ' (mínimo 12 caracteres)'}</label><input name="password" id="password" type="password" required minLength={mode === 'login' ? 1 : 12} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></div>}
 <p role="status">{message}</p><button disabled={busy}>{busy ? 'Procesando…' : 'Continuar'}</button></form></section>;
}
export function SignOut() {
 const [message,setMessage] = useState(''); const [busy,setBusy] = useState(false); const router = useRouter();
 return <><button disabled={busy} onClick={async () => {setBusy(true); try {const {error} = await supabaseBrowser().auth.signOut();if(error) throw error; router.replace('/auth');router.refresh();} catch {setMessage('No se pudo cerrar sesión. Intentá nuevamente.');} finally {setBusy(false);}}}>Cerrar sesión</button><p role="status">{message}</p></>;
}
