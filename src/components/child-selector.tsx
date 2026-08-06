import Link from "next/link";
import type { LinkedStudent } from "@/lib/parent-access";
import { CLASS_LABELS } from "@/lib/constants";

export function ChildSelector({
  basePath,
  linked,
  selectedId,
}: {
  basePath: string;
  linked: LinkedStudent[];
  selectedId: string;
}) {
  if (linked.length <= 1) return null;

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {linked.map((s) => (
        <Link
          key={s.id}
          href={`${basePath}?studentId=${s.id}`}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            s.id === selectedId
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {s.fullName} ({CLASS_LABELS[s.classLevel]})
        </Link>
      ))}
    </div>
  );
}
