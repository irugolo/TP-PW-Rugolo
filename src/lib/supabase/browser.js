'use client';
import { createBrowserClient } from '@supabase/ssr';
import { config } from './config';
export function supabaseBrowser() { return createBrowserClient(...config()); }
