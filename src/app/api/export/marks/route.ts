import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { CLASS_LABELS } from "@/lib/constants";

const TYPE_LABELS: Record<string, string> = {
  WEEKLY_TEST: "Weekly Test",
  MONTHLY_TEST: "Monthly Test",
  EXAM: "Exam",
};

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return new Response("Unauthorized", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get("classLevel");
  const subjectId = searchParams.get("subjectId");

  if (classLevel && !(classLevel in CLASS_LABELS)) {
    return new Response("Invalid classLevel", { status: 400 });
  }

  const marks = await db.assessmentMark.findMany({
    where: {
      assessment: {
        ...(classLevel ? { classLevel: classLevel as keyof typeof CLASS_LABELS } : {}),
        ...(subjectId ? { subjectId } : {}),
      },
    },
    include: { student: true, assessment: { include: { subject: true } } },
    orderBy: [{ assessment: { date: "desc" } }, { student: { fullName: "asc" } }],
  });

  const rows = marks.map((m) => ({
    studentName: m.student.fullName,
    classLevel: CLASS_LABELS[m.assessment.classLevel] ?? m.assessment.classLevel,
    subject: m.assessment.subject.name,
    assessmentTitle: m.assessment.title,
    assessmentType: TYPE_LABELS[m.assessment.assessmentType] ?? m.assessment.assessmentType,
    date: m.assessment.date.toISOString().slice(0, 10),
    marksObtained: Number(m.marksObtained),
    maxMarks: Number(m.assessment.maxMarks),
    percentage: Math.round((Number(m.marksObtained) / Number(m.assessment.maxMarks)) * 100),
  }));

  const csv = toCsv(rows, [
    { key: "studentName", label: "Student" },
    { key: "classLevel", label: "Class" },
    { key: "subject", label: "Subject" },
    { key: "assessmentTitle", label: "Assessment" },
    { key: "assessmentType", label: "Type" },
    { key: "date", label: "Date" },
    { key: "marksObtained", label: "Marks Obtained" },
    { key: "maxMarks", label: "Max Marks" },
    { key: "percentage", label: "Percentage" },
  ]);

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `marks-${date}.csv`);
}
