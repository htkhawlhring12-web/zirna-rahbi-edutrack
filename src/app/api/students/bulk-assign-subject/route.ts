import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { bulkAssignSubjectSchema } from "@/lib/validations/student";

// POST /api/students/bulk-assign-subject -- assigns a subject (and
// optionally a teacher) to every active student in a class at once.
// Students who already have this subject assigned are skipped rather than
// erroring the whole batch, so this is safe to run again later for
// newly-added students in that class without duplicating anyone.
export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bulkAssignSubjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { classLevel, subjectId, teacherId } = parsed.data;

  const students = await db.student.findMany({
    where: { classLevel, isActive: true },
    select: { id: true },
  });

  const alreadyAssigned = new Set(
    (
      await db.studentSubject.findMany({
        where: { subjectId, studentId: { in: students.map((s) => s.id) } },
        select: { studentId: true },
      })
    ).map((ss) => ss.studentId)
  );

  const toAssign = students.filter((s) => !alreadyAssigned.has(s.id));

  if (toAssign.length > 0) {
    await db.studentSubject.createMany({
      data: toAssign.map((s) => ({
        studentId: s.id,
        subjectId,
        teacherId: teacherId || null,
      })),
    });
  }

  return NextResponse.json({
    assignedCount: toAssign.length,
    skippedCount: alreadyAssigned.size,
  });
}
