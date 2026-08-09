import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createParentAndLinkSchema,
  linkExistingParentSchema,
} from "@/lib/validations/parent";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/students/[id]/parents -- list parents linked to this student.
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN", "ASSISTANT"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: studentId } = await params;

  const links = await db.parentStudentLink.findMany({
    where: { studentId },
    include: { parent: true },
  });

  return NextResponse.json({ links });
}

// POST /api/students/[id]/parents -- two modes, distinguished by body shape:
//   { parentUserId, relationship }              -> link an existing parent
//   { fullName, email, phone, relationship }     -> create a new parent + link
//
// Creating a new parent follows the same pattern as staff account creation
// (src/app/api/users/route.ts): a throwaway password + a one-time
// recovery link returned to the admin, never a password typed or stored.
export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: studentId } = await params;
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const body = await request.json();

  // Mode 1: link an existing parent account (e.g. a sibling already enrolled).
  if (body.parentUserId) {
    const parsed = linkExistingParentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const parent = await db.user.findUnique({
      where: { id: parsed.data.parentUserId },
    });
    if (!parent || parent.role !== "PARENT") {
      return NextResponse.json(
        { error: "That account is not a parent account." },
        { status: 400 }
      );
    }

    try {
      const link = await db.parentStudentLink.create({
        data: {
          studentId,
          parentUserId: parsed.data.parentUserId,
          relationship: parsed.data.relationship || null,
        },
        include: { parent: true },
      });
      return NextResponse.json({ link }, { status: 201 });
    } catch {
      return NextResponse.json(
        { error: "This parent is already linked to this student." },
        { status: 409 }
      );
    }
  }

  // Mode 2: create a brand-new parent account and link it in one step.
  const parsed = createParentAndLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { fullName, email, phone, relationship } = parsed.data;

  const supabaseAdmin = createAdminClient();
  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: true,
      app_metadata: { role: "PARENT" },
      user_metadata: { full_name: fullName },
    });

  if (createError || !created.user) {
    const message = createError?.message ?? "Failed to create parent account";
    const status = message.toLowerCase().includes("already") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    await db.user.create({
      data: { id: created.user.id, email, fullName, role: "PARENT", phone: phone || null },
    });
    await db.parentStudentLink.create({
      data: {
        studentId,
        parentUserId: created.user.id,
        relationship: relationship || null,
      },
    });
  } catch (dbError) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    console.error("Failed to save parent profile/link:", dbError);
    return NextResponse.json(
      { error: "Failed to save parent account. Please try again." },
      { status: 500 }
    );
  }

  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email });

  return NextResponse.json({
    parent: { id: created.user.id, fullName, email },
    setPasswordLink: linkError ? null : linkData?.properties?.action_link ?? null,
  });
}
