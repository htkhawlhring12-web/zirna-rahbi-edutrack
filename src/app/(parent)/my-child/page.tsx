import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLinkedStudents, resolveSelectedStudent } from "@/lib/parent-access";
import { CLASS_LABELS } from "@/lib/constants";
import { computeAttendanceRate, type AttendanceInput } from "@/lib/at-risk";
import { getAtRiskConfig } from "@/lib/at-risk-config";
import { ChildSelector } from "@/components/child-selector";
import { FeeStatusBadge } from "@/components/fee-status-badge";

// Plain helper, not part of the component body -- this version's React
// lint rules require Server Component render bodies to stay pure, and
// computeAttendanceRate depends on Date.now() internally.
async function loadChildOverview(studentId: string) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { subjects: { include: { subject: true, teacher: true } } },
  });

  const { attendanceWindowDays: windowDays } = await getAtRiskConfig();
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const records: AttendanceInput[] = (
    await db.attendanceRecord.findMany({
      where: { studentId, date: { gte: cutoff } },
      select: { date: true, status: true },
    })
  ).map((r) => ({ date: r.date, status: r.status }));

  const attendance = computeAttendanceRate(records, windowDays);

  const feePayments = await db.feePayment.findMany({
    where: { studentId },
    orderBy: { dueDate: "desc" },
    take: 10,
  });

  return { student, attendance, windowDays, feePayments };
}

export default async function MyChildPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") redirect("/login");

  const { studentId } = await searchParams;
  const linked = await getLinkedStudents(user.id);
  const selected = resolveSelectedStudent(linked, studentId);

  if (!selected) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-lg font-semibold text-slate-900">My Child</h1>
        <p className="mt-4 text-sm text-slate-500">
          No student is linked to your account yet. Please contact the centre.
        </p>
      </main>
    );
  }

  const { student, attendance, windowDays, feePayments } = await loadChildOverview(selected.id);
  if (!student) redirect("/login");

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">My Child</h1>

      <div className="mt-4">
        <ChildSelector basePath="/my-child" linked={linked} selectedId={selected.id} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-base font-medium text-slate-900">{student.fullName}</p>
        <p className="mt-1 text-sm text-slate-500">
          {CLASS_LABELS[student.classLevel]}
          {student.section ? ` · Section ${student.section}` : ""}
          {student.schoolName ? ` · ${student.schoolName}` : ""}
        </p>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-700">
          Attendance (last {windowDays} days)
        </h2>
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4">
          {attendance ? (
            <p className="text-sm text-slate-900">
              <span className="text-2xl font-semibold">
                {Math.round(attendance.rate)}%
              </span>{" "}
              <span className="text-slate-500">
                ({attendance.present} of {attendance.total} days present)
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-400">No attendance recorded yet.</p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-700">Subjects</h2>
        <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {student.subjects.map((ss) => (
            <li key={ss.id} className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-slate-900">{ss.subject.name}</p>
              <p className="text-xs text-slate-500">
                {ss.teacher ? ss.teacher.fullName : "No teacher assigned"}
              </p>
            </li>
          ))}
          {student.subjects.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              No subjects assigned yet.
            </li>
          )}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-700">Fees</h2>
        <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {feePayments.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  ₹{Number(p.amountDue)} due {p.dueDate.toLocaleDateString()}
                </p>
                {Number(p.amountPaid) > 0 && (
                  <p className="text-xs text-slate-500">
                    ₹{Number(p.amountPaid)} paid
                    {p.paidDate ? ` on ${p.paidDate.toLocaleDateString()}` : ""}
                  </p>
                )}
              </div>
              <FeeStatusBadge
                payment={{
                  status: p.status,
                  dueDate: p.dueDate,
                  amountDue: Number(p.amountDue),
                  amountPaid: Number(p.amountPaid),
                }}
              />
            </li>
          ))}
          {feePayments.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              No fee records yet.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
