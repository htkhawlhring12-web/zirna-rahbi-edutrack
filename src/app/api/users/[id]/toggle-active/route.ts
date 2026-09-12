import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/users/[id]/toggle-active -- flips a staff member's active
// status. Used instead of deleting someone who has left, so their
// attendance/assessment/marks history is preserved rather than lost or
// blocked by foreign key constraints.
export async function PATCH(_request: Request, { params }: RouteParams) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  if (id === currentUser.id) {
    return NextResponse.json(
      { error: "You cannot deactivate your own account." },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const updated = await db.user.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  return NextResponse.json({ user: updated });
}