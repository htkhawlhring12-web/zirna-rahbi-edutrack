import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/students/[id]/toggle-active -- flips a student's active
// status. Used instead of deleting a student who has left, so their
// attendance/marks/fee history is preserved rather than permanently lost.
export async function PATCH(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.student.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const student = await db.student.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  return NextResponse.json({ student });
}