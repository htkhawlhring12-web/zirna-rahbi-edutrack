import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// DELETE /api/assessments/[id] -- admin removes an assessment (e.g. a
// wrongly-created duplicate) along with any marks already entered for it.
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const assessment = await db.assessment.findUnique({ where: { id } });
  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  await db.assessment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}