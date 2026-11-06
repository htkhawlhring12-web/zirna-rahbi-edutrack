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

// DELETE /api/students/[id] -- admin removes a student. Refuses if the
// student has any fee, attendance, marks or report card records, because
// deleting would permanently wipe that history. Use "Mark as inactive"
// for students who have left; delete is only for mistakes.
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

  const [fees, attendance, marks, reportCards] = await Promise.all([
    db.feePayment.count({ where: { studentId: id } }),
    db.attendanceRecord.count({ where: { studentId: id } }),
    db.assessmentMark.count({ where: { studentId: id } }),
    db.reportCard.count({ where: { studentId: id } }),
  ]);

  if (fees + attendance + marks + reportCards > 0) {
    return NextResponse.json(
      {
        error: `This student has records (${fees} fees, ${attendance} attendance, ${marks} marks, ${reportCards} report cards). Deleting would erase them. Use "Mark as inactive" instead.`,
      },
      { status: 409 }
    );
  }

  await db.student.delete({ where: { id } });

  return NextResponse.json({ success: true });
}