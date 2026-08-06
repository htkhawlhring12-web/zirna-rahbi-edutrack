import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { submitMarksSchema } from "@/lib/validations/assessment";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/assessments/[id]/marks -- the assessment plus every student who
// takes that subject in that class, each with their existing mark (or
// null if not yet entered). Mirrors the attendance endpoint's merged
// shape so the marks-entry UI can render one row per student directly.
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const assessment = await db.assessment.findUnique({
    where: { id },
    include: { subject: true },
  });
  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const eligibleStudents = await db.studentSubject.findMany({
    where: {
      subjectId: assessment.subjectId,
      student: { classLevel: assessment.classLevel, isActive: true },
    },
    include: { student: true },
    orderBy: { student: { fullName: "asc" } },
  });

  const existingMarks = await db.assessmentMark.findMany({
    where: { assessmentId: id },
  });
  const byStudent = new Map<string, (typeof existingMarks)[number]>(
    existingMarks.map((m) => [m.studentId, m])
  );

  return NextResponse.json({
    assessment,
    students: eligibleStudents.map((ss) => {
      const mark = byStudent.get(ss.studentId);
      return {
        id: ss.student.id,
        fullName: ss.student.fullName,
        marksObtained: mark ? Number(mark.marksObtained) : null,
        remarks: mark?.remarks ?? "",
      };
    }),
  });
}

// POST /api/assessments/[id]/marks -- bulk create/update marks.
// ADMIN can enter marks for any assessment. TEACHER can only enter marks
// for a student they specifically teach this subject to (mirrors the RLS
// policy in supabase/sql/001_rls_policies.sql, "marks_teacher_write_own_subject",
// so the two layers agree on the rule even though only this one is
// actually enforced through Prisma).
export async function POST(request: Request, { params }: RouteParams) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN", "TEACHER"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: assessmentId } = await params;
  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
  });
  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = submitMarksSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { records } = parsed.data;

  if (records.some((r) => r.marksObtained > Number(assessment.maxMarks))) {
    return NextResponse.json(
      { error: `Marks can't exceed the max marks (${assessment.maxMarks}).` },
      { status: 400 }
    );
  }

  if (currentUser.role === "TEACHER") {
    const allowedStudentIds = new Set(
      (
        await db.studentSubject.findMany({
          where: { subjectId: assessment.subjectId, teacherId: currentUser.id },
          select: { studentId: true },
        })
      ).map((s) => s.studentId)
    );
    const disallowed = records.filter((r) => !allowedStudentIds.has(r.studentId));
    if (disallowed.length > 0) {
      return NextResponse.json(
        { error: "You don't teach this subject to one or more of these students." },
        { status: 403 }
      );
    }
  }

  await db.$transaction(
    records.map((r) =>
      db.assessmentMark.upsert({
        where: {
          assessmentId_studentId: { assessmentId, studentId: r.studentId },
        },
        update: {
          marksObtained: r.marksObtained,
          remarks: r.remarks || null,
          enteredBy: currentUser.id,
        },
        create: {
          assessmentId,
          studentId: r.studentId,
          marksObtained: r.marksObtained,
          remarks: r.remarks || null,
          enteredBy: currentUser.id,
        },
      })
    )
  );

  return NextResponse.json({ success: true, count: records.length });
}
