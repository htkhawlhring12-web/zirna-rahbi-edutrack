import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStaffSchema } from "@/lib/validations/user";

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
  const { fullName, email, phone, role, password } = parsed.data;

  const supabaseAdmin = createAdminClient();

  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
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
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    console.error("Failed to save staff profile:", dbError);
    return NextResponse.json(
      { error: "Failed to save account. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    user: { id: created.user.id, fullName, email, role },
  });
}