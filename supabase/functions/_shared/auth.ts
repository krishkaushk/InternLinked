import { createClient, SupabaseClient, User } from 'jsr:@supabase/supabase-js@2';
import { AppError } from './errors.ts';

export interface AuthContext {
  user: User;
  // Carries the caller's JWT — RLS applies. Use for anything scoped to the calling user.
  userClient: SupabaseClient;
  // Service-role key — bypasses RLS. Use ONLY for rate-limit bookkeeping and shared caches.
  adminClient: SupabaseClient;
}

// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-injected into every
// Edge Function's environment by the platform — never set these via `supabase secrets set`,
// and never log them.
export async function requireUser(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new AppError('UNAUTHORIZED', 'Missing Authorization header');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired session');
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return { user, userClient, adminClient };
}
