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
        // Use default cookie-based storage (required for SSR auth in (main)/layout.tsx).
        // persistSession controls whether cookies are persistent (survive browser close)
        // or session-scoped (cleared on browser close), preserving "remember me" semantics.
        persistSession: rememberMe,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}
