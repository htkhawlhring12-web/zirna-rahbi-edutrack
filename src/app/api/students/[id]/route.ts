import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateStudentSchema } from "@/lib/validations/student";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/students/[id] -- full student detail: profile, subjects, parents.
// Staff-only here; parents fetch their own child through a separate,
// parent_student_links-scoped path (see the (parent) route group).
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN", "TEACHER", "ASSISTANT"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const student = await db.student.findUnique({
    where: { id },
    include: {
      subjects: { include: { subject: true, teacher: true } },
      parentLinks: { include: { parent: true } },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json({ student });
}

// PATCH /api/students/[id] -- admin edits student profile fields.
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { dateOfBirth, admissionDate, ...rest } = parsed.data;

  const student = await db.student.update({
    where: { id },
    data: {
      ...rest,
      ...(dateOfBirth !== undefined && {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      }),
      ...(admissionDate !== undefined && {
        admissionDate: admissionDate ? new Date(admissionDate) : null,
      }),
    },
  });

  return NextResponse.json({ student });
}

// DELETE /api/students/[id] -- admin permanently removes a student and
// everything tied to them (subjects, attendance, marks, fees, report
// cards, parent links). This cannot be undone, so the button on the
// detail page asks for confirmation before calling this.
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const student = await db.student.findUnique({ where: { id } });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Prisma's onDelete: Cascade (set in schema.prisma) handles removing the
  // related subjects, attendance records, marks, fee payments, report
  // cards, and parent links automatically when the student is deleted.
  await db.student.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
