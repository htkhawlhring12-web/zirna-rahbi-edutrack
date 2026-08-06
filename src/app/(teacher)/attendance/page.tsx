import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AttendanceMarking } from "@/components/forms/attendance-marking";

export default async function AttendancePage() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "TEACHER", "ASSISTANT"].includes(user.role)) {
    redirect("/login");
  }

  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Attendance</h1>
      <p className="mt-1 text-sm text-slate-500">
        Pick a date, class, and subject (or leave it as whole-day), then mark
        each student.
      </p>

      <div className="mt-6">
        <AttendanceMarking subjects={subjects} />
      </div>
    </main>
  );
}
