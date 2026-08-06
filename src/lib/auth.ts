import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

/**
 * Returns the logged-in user's app profile (role, name, etc.), or null if
 * no one is logged in. This checks Supabase Auth for the session, then
 * looks up the matching row in our own `users` table for the role.
 *
 * Note: this is a *convenience* helper for building pages/UI. It is NOT
 * the security boundary — that's enforced by Postgres Row-Level Security
 * policies (see /docs/architecture.md §6), so even if a page forgets to
 * call this, the database itself will not return another family's data.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await db.user.findUnique({
    where: { id: user.id },
  });

  if (!profile || !profile.isActive) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role,
  };
}

/** Throws-style guard for use at the top of Server Components/Route Handlers. */
export async function requireRole(
  allowed: UserRole[]
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !allowed.includes(user.role)) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
