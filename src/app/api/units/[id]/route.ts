import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// DELETE /api/units/[id] -- admin removes a unit and its chapters.
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await db.unit.delete({ where: { id } });

  return NextResponse.json({ success: true });
}