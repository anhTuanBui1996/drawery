import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Invalid/Missing environment variable: "SUPABASE_SERVICE_ROLE_KEY"',
  );
}

// Server-only client that bypasses RLS. Authorization is done in the API
// routes (next-auth session), so never import this from client code.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export default supabaseAdmin;
