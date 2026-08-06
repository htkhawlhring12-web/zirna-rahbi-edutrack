import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignSubjectSchema } from "@/lib/validations/student";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/students/[id]/subjects -- admin assigns a subject (and
// optionally a teacher) to a student.
export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: studentId } = await params;
  const body = await request.json();
  const parsed = assignSubjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { subjectId, teacherId } = parsed.data;

  try {
    const studentSubject = await db.studentSubject.create({
      data: { studentId, subjectId, teacherId: teacherId || null },
      include: { subject: true, teacher: true },
    });
    return NextResponse.json({ studentSubject }, { status: 201 });
  } catch {
    // Most likely the unique(studentId, subjectId) constraint -- this
    // student already has this subject assigned.
    return NextResponse.json(
      { error: "This subject is already assigned to this student." },
      { status: 409 }
    );
  }
}

// DELETE /api/students/[id]/subjects?studentSubjectId=... -- admin removes
// a subject assignment.
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: studentId } = await params;
  const { searchParams } = new URL(request.url);
  const studentSubjectId = searchParams.get("studentSubjectId");

  if (!studentSubjectId) {
    return NextResponse.json(
      { error: "studentSubjectId is required" },
      { status: 400 }
    );
  }

  await db.studentSubject.deleteMany({
    where: { id: studentSubjectId, studentId },
  });

  return NextResponse.json({ success: true });
}
