'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Check if user wants to be remembered (persistent session)
  // Default to true for backwards compatibility with existing sessions
  const rememberMeValue = typeof window !== 'undefined'
    ? localStorage.getItem('bedrock-remember-me')
    : null;

  const rememberMe = rememberMeValue === 'false' ? false : true;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use localStorage for persistent sessions, sessionStorage for temporary
        storage: typeof window !== 'undefined'
          ? (rememberMe ? window.localStorage : window.sessionStorage)
          : undefined,
        persistSession: rememberMe,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}
