import Link from "next/link";
import { CLASS_LABELS } from "@/lib/constants";
import type { AtRiskStudent } from "@/lib/at-risk";

const FLAG_STYLES: Record<string, string> = {
  LOW_ATTENDANCE: "bg-amber-50 text-amber-700 border-amber-200",
  CONSECUTIVE_ABSENCES: "bg-red-50 text-red-700 border-red-200",
  LOW_AVERAGE: "bg-red-50 text-red-700 border-red-200",
  DECLINING_TREND: "bg-amber-50 text-amber-700 border-amber-200",
};

export function AtRiskWidget({ students }: { students: AtRiskStudent[] }) {
  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-500">
          No students currently flagged. Nice.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {students.map((s) => (
        <li key={s.studentId}>
          <Link
            href={`/students/${s.studentId}`}
            className="flex flex-col gap-2 px-4 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{s.fullName}</p>
              <p className="text-xs text-slate-500">{CLASS_LABELS[s.classLevel]}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {s.flags.map((flag, i) => (
                <span
                  key={i}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    FLAG_STYLES[flag.type] ?? "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                  title={flag.detail}
                >
                  {flag.label} · {flag.detail}
                </span>
              ))}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
