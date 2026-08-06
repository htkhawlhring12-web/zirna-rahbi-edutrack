import { db } from "@/lib/db";

export type LinkedStudent = { id: string; fullName: string; classLevel: string };

export async function getLinkedStudents(
  parentUserId: string
): Promise<LinkedStudent[]> {
  const links = await db.parentStudentLink.findMany({
    where: { parentUserId },
    include: { student: true },
    orderBy: { student: { fullName: "asc" } },
  });

  return links
    .filter((l) => l.student.isActive)
    .map((l) => ({
      id: l.student.id,
      fullName: l.student.fullName,
      classLevel: l.student.classLevel,
    }));
}

/**
 * Resolves which student a parent-facing page should display.
 *
 * The requested id comes from a URL query param (?studentId=...), which is
 * entirely client-controlled -- so it is NEVER used directly. It's only
 * accepted if it's actually present in `linked` (the parent's real,
 * database-verified children). This is what stops a parent from viewing
 * another family's child just by editing the URL, and it's the actual
 * enforcement point for every page in the (parent) route group.
 */
export function resolveSelectedStudent(
  linked: LinkedStudent[],
  requestedId?: string
): LinkedStudent | null {
  if (linked.length === 0) return null;
  if (requestedId) {
    const match = linked.find((s) => s.id === requestedId);
    if (match) return match;
  }
  return linked[0];
}
