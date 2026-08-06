// Renamed from middleware.ts -> proxy.ts: as of Next.js 16, "Middleware" is
// called "Proxy" (same purpose, new name/export). See:
// node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Route groups like (admin) don't add a URL prefix, so access control here
// is keyed off the actual pathname. Keep this in sync with the folders
// under src/app/(admin), src/app/(teacher), src/app/(parent).
const ROLE_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: "/dashboard", roles: ["ADMIN"] },
  { prefix: "/students", roles: ["ADMIN"] },
  { prefix: "/staff", roles: ["ADMIN"] },
  { prefix: "/fees", roles: ["ADMIN"] },
  { prefix: "/settings", roles: ["ADMIN"] },
  { prefix: "/export", roles: ["ADMIN"] },
  { prefix: "/attendance", roles: ["ADMIN", "TEACHER", "ASSISTANT"] },
  { prefix: "/marks-entry", roles: ["ADMIN", "TEACHER"] },
  { prefix: "/my-students", roles: ["ADMIN", "TEACHER", "ASSISTANT"] },
  { prefix: "/my-child", roles: ["PARENT"] },
  { prefix: "/progress", roles: ["PARENT"] },
  { prefix: "/report-cards", roles: ["PARENT", "ADMIN"] },
];

const PUBLIC_ROUTES = ["/login", "/reset-password"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_ROUTES.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role check: only enforced when a rule matches the path. We read the
  // role from app_metadata ONLY -- never user_metadata. app_metadata can
  // only be set by the service-role admin API (see src/app/api/users and
  // src/lib/supabase/admin.ts); user_metadata can be edited by the user
  // themselves via supabase.auth.updateUser(), which would let anyone
  // grant themselves ADMIN if we trusted it here.
  //
  // This check is an OPTIMISTIC, fast redirect for UX (avoids a flash of
  // the wrong page) -- it is not the real security boundary. The actual
  // boundary is requireRole()/getCurrentUser() in src/lib/auth.ts, called
  // inside every Server Component and API route, which reads the
  // authoritative role from our own `users` table on every request.
  const rule = ROLE_ROUTES.find((r) => path.startsWith(r.prefix));
  if (rule && user) {
    const role = user.app_metadata?.role;
    if (!role || !rule.roles.includes(role)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image optimization.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
