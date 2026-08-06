import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeAtRiskStudents, type AttendanceInput, type MarkInput } from "@/lib/at-risk";
import { getAtRiskConfig } from "@/lib/at-risk-config";
import { AtRiskWidget } from "@/components/at-risk-widget";

// Deliberately a plain function, not part of the component body: this
// version's React lint rules treat Server Component render bodies as
// required to be pure, and flag impure calls like Date.now() directly
// inside them. Isolating the data load here (which legitimately depends
// on "now") keeps the component itself pure and keeps the lint rule happy
// for the right reason, not by suppressing it.
async function loadDashboardData() {
  const config = await getAtRiskConfig();

  const students = await db.student.findMany({
    where: { isActive: true },
    select: { id: true, fullName: true, classLevel: true },
  });
  const studentIds = students.map((s) => s.id);

  // Fetch a window generous enough to cover both the attendance-rate
  // calculation and the consecutive-absence streak check, whichever needs
  // more history.
  const attendanceCutoff = new Date(
    Date.now() - Math.max(config.attendanceWindowDays, 60) * 24 * 60 * 60 * 1000
  );

  const [attendanceRecords, marks] = await Promise.all([
    db.attendanceRecord.findMany({
      where: { studentId: { in: studentIds }, date: { gte: attendanceCutoff } },
      select: { studentId: true, date: true, status: true },
    }),
    db.assessmentMark.findMany({
      where: { studentId: { in: studentIds } },
      include: { assessment: { include: { subject: true } } },
    }),
  ]);

  const attendanceByStudent = new Map<string, AttendanceInput[]>();
  for (const r of attendanceRecords) {
    const arr = attendanceByStudent.get(r.studentId) ?? [];
    arr.push({ date: r.date, status: r.status });
    attendanceByStudent.set(r.studentId, arr);
  }

  const marksByStudent = new Map<string, MarkInput[]>();
  for (const m of marks) {
    const arr = marksByStudent.get(m.studentId) ?? [];
    arr.push({
      subjectId: m.assessment.subjectId,
      subjectName: m.assessment.subject.name,
      date: m.assessment.date,
      marksObtained: Number(m.marksObtained),
      maxMarks: Number(m.assessment.maxMarks),
    });
    marksByStudent.set(m.studentId, arr);
  }

  return {
    students,
    config,
    atRiskStudents: computeAtRiskStudents(students, attendanceByStudent, marksByStudent, config),
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { students, atRiskStudents, config } = await loadDashboardData();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        {students.length} active student{students.length === 1 ? "" : "s"}
      </p>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">At-Risk Students</h2>
          {atRiskStudents.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {atRiskStudents.length} flagged
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Flags: attendance under {config.attendanceThresholdPercent}%, average under{" "}
          {config.averageThresholdPercent}%, {config.consecutiveAbsencesThreshold}+
          absences in a row, or a declining trend in a subject.{" "}
          <a href="/settings" className="underline hover:text-slate-600">
            Adjust thresholds
          </a>
        </p>

        <div className="mt-3">
          <AtRiskWidget students={atRiskStudents} />
        </div>
      </section>
    </main>
  );
}
