import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStaffSchema } from "@/lib/validations/user";

// GET /api/users -- list staff accounts (admin, teacher, assistant).
// Used by the (admin)/staff page.
export async function GET() {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const staff = await db.user.findMany({
    where: { role: { in: ["ADMIN", "TEACHER", "ASSISTANT"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ staff });
}

// POST /api/users -- admin creates a new staff account.
//
// Design note: we never set or transmit a real password for the new
// account. We create it with a throwaway random password the admin never
// sees, then generate a one-time "set your password" recovery link and
// return it in the response so the admin can hand it directly to the new
// staff member (e.g. via WhatsApp). This avoids needing transactional
// email delivery configured just to onboard 1-3 staff members, and avoids
// ever having a real password pass through a form field or database.
export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { fullName, email, phone, role } = parsed.data;

  const supabaseAdmin = createAdminClient();

  // The role goes in app_metadata specifically -- see the comment in
  // src/proxy.ts for why that (and not user_metadata) is the field that's
  // safe to trust for authorization.
  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { full_name: fullName },
    });

  if (createError || !created.user) {
    const message = createError?.message ?? "Failed to create account";
    const status = message.toLowerCase().includes("already") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    await db.user.create({
      data: {
        id: created.user.id,
        email,
        fullName,
        role,
        phone: phone || null,
      },
    });

    if (role === "TEACHER" || role === "ASSISTANT") {
      await db.staffProfile.create({
        data: { userId: created.user.id, joinedDate: new Date() },
      });
    }
  } catch (dbError) {
    // Keep the auth account and our own `users` table from ever
    // disagreeing: if the DB write fails, undo the auth account too.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    console.error("Failed to save staff profile:", dbError);
    return NextResponse.json(
      { error: "Failed to save account. Please try again." },
      { status: 500 }
    );
  }

  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

  return NextResponse.json({
    user: { id: created.user.id, fullName, email, role },
    setPasswordLink: linkError ? null : linkData?.properties?.action_link ?? null,
  });
}
