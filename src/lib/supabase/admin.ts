import { createClient } from "@supabase/supabase-js";

// Server-only client using the Supabase SERVICE ROLE key, which bypasses
// Row-Level Security and can perform admin actions (creating users,
// generating password-set links, etc).
//
// NEVER import this file from a Client Component ("use client"), and
// NEVER let SUPABASE_SERVICE_ROLE_KEY reach the browser bundle -- it is
// intentionally left out of NEXT_PUBLIC_* env vars for that reason.
// Only call this from Route Handlers (src/app/api/**) or Server Actions,
// and always gate the call with requireRole(["ADMIN"]) first.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
