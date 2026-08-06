import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAssessmentSchema } from "@/lib/validations/assessment";

// GET /api/assessments -- list assessments, most recent first.
export async function GET() {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const assessments = await db.assessment.findMany({
    include: {
      subject: true,
      _count: { select: { marks: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ assessments });
}

// POST /api/assessments -- create a new assessment.
// ADMIN can create for any subject/class. TEACHER can only create for a
// subject they actually teach to at least one student in that class --
// otherwise a teacher could create (and grade) tests for a subject that
// isn't theirs.
export async function POST(request: Request) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN", "TEACHER"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createAssessmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { subjectId, classLevel, title, assessmentType, maxMarks, date, chapterTopic } =
    parsed.data;

  if (currentUser.role === "TEACHER") {
    const teaches = await db.studentSubject.findFirst({
      where: {
        subjectId,
        teacherId: currentUser.id,
        student: { classLevel, isActive: true },
      },
    });
    if (!teaches) {
      return NextResponse.json(
        { error: "You don't teach this subject to this class." },
        { status: 403 }
      );
    }
  }

  const assessment = await db.assessment.create({
    data: {
      subjectId,
      classLevel,
      title,
      assessmentType,
      maxMarks,
      date: new Date(date),
      chapterTopic: chapterTopic || null,
      createdBy: currentUser.id,
    },
  });

  return NextResponse.json({ assessment }, { status: 201 });
}
