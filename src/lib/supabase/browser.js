'use client';
import { createBrowserClient } from '@supabase/ssr';
import { config, sessionCookieOptions } from './config';
export function supabaseBrowser() { return createBrowserClient(...config(), { cookieOptions: sessionCookieOptions(window.location.protocol === 'https:'), global: { fetch: timedFetch } }); }

async function timedFetch(input, init = {}) {
 const signal = AbortSignal.timeout(15000);
 return fetch(input, { ...init, signal: init.signal ? AbortSignal.any([init.signal, signal]) : signal });
}
