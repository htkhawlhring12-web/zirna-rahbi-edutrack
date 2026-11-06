import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteParams = { params: Promise<{ id: string }> };

// DELETE /api/users/[id] -- admin removes a staff account. Refuses if the
// person has any attendance, tests, marks, fee entries or report cards
// tied to them. Use "Deactivate" for staff who have left. An admin cannot
// delete their own account.
export async function DELETE(_request: Request, { params }: RouteParams) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  if (id === currentUser.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const [attendance, assessments, marks, fees, reportCards, chapters] =
    await Promise.all([
      db.attendanceRecord.count({ where: { markedBy: id } }),
      db.assessment.count({ where: { createdBy: id } }),
      db.assessmentMark.count({ where: { enteredBy: id } }),
      db.feePayment.count({ where: { recordedBy: id } }),
      db.reportCard.count({ where: { generatedBy: id } }),
      db.chapterProgress.count({ where: { completedBy: id } }),
    ]);

  if (attendance + assessments + marks + fees + reportCards + chapters > 0) {
    return NextResponse.json(
      {
        error:
          "This person has records tied to them (attendance, tests, marks or fees). Deleting would erase or break that history. Use Deactivate instead.",
      },
      { status: 409 }
    );
  }

  const supabaseAdmin = createAdminClient();
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete the login account. Please try again." },
      { status: 500 }
    );
  }

  await db.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}