import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CLASS_OPTIONS } from "@/lib/constants";

export default async function ExportPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });

  const selectClass =
    "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
  const button =
    "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800";

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Data Export</h1>
      <p className="mt-1 text-sm text-slate-500">
        Download CSV files for your own backups or reporting. These open
        straight into Excel/Google Sheets.
      </p>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-700">Students</h2>
        <p className="mt-1 text-xs text-slate-400">Full roster, all fields.</p>
        <form method="GET" action="/api/export/students" className="mt-3">
          <button type="submit" className={button}>
            Export students CSV
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-700">Attendance</h2>
        <p className="mt-1 text-xs text-slate-400">
          Leave any field blank to include everything.
        </p>
        <form method="GET" action="/api/export/attendance" className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="att-class">
              Class
            </label>
            <select id="att-class" name="classLevel" defaultValue="" className={selectClass}>
              <option value="">All classes</option>
              {CLASS_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="att-since">
              From
            </label>
            <input id="att-since" type="date" name="sinceDate" className={selectClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="att-until">
              To
            </label>
            <input id="att-until" type="date" name="untilDate" className={selectClass} />
          </div>
          <button type="submit" className={button}>
            Export attendance CSV
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-700">Marks</h2>
        <p className="mt-1 text-xs text-slate-400">
          Leave any field blank to include everything.
        </p>
        <form method="GET" action="/api/export/marks" className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="marks-class">
              Class
            </label>
            <select id="marks-class" name="classLevel" defaultValue="" className={selectClass}>
              <option value="">All classes</option>
              {CLASS_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="marks-subject">
              Subject
            </label>
            <select id="marks-subject" name="subjectId" defaultValue="" className={selectClass}>
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={button}>
            Export marks CSV
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-700">Fees</h2>
        <p className="mt-1 text-xs text-slate-400">All fee payments on record.</p>
        <form method="GET" action="/api/export/fee-payments" className="mt-3">
          <button type="submit" className={button}>
            Export fee payments CSV
          </button>
        </form>
      </section>
    </main>
  );
}
