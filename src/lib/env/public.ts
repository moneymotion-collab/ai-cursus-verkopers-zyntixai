const PUBLIC_SUPABASE_URL = "NEXT_PUBLIC_SUPABASE_URL";
const PUBLIC_SUPABASE_PUBLISHABLE_KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export type PublicSupabaseEnv = {
  url: string;
  publishableKey: string;
};

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env[PUBLIC_SUPABASE_URL];
  const publishableKey = process.env[PUBLIC_SUPABASE_PUBLISHABLE_KEY];

  if (!url || url.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${PUBLIC_SUPABASE_URL}`);
  }

  if (!publishableKey || publishableKey.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
    );
  }

  return {
    url: url.trim(),
    publishableKey: publishableKey.trim(),
  };
}

/** Browser-safe subset for client components. */
export function getBrowserSupabaseEnv(): PublicSupabaseEnv {
  return getPublicSupabaseEnv();
}
