import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { bulkCreateFeePaymentSchema } from "@/lib/validations/fee";

// POST /api/fee-payments/bulk-create -- creates a fee due (e.g. "October
// tuition") for every active student in a class in one action, instead of
// visiting each student's page individually. This is the recurring task
// most likely to be run every billing cycle, so it's the one bulk action
// worth building on the fees side specifically.
export async function POST(request: Request) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bulkCreateFeePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { classLevel, amountDue, dueDate, notes } = parsed.data;

  const students = await db.student.findMany({
    where: { classLevel, isActive: true },
    select: { id: true },
  });

  if (students.length > 0) {
    await db.feePayment.createMany({
      data: students.map((s) => ({
        studentId: s.id,
        amountDue,
        dueDate: new Date(dueDate),
        status: "PENDING" as const,
        recordedBy: currentUser.id,
        notes: notes || null,
      })),
    });
  }

  return NextResponse.json({ createdCount: students.length });
}
