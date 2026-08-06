import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createFeePaymentSchema } from "@/lib/validations/fee";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/students/[id]/fee-payments -- list a student's fee payments.
// Admin only here; parents get their child's fees through the
// parent_student_links-scoped /my-child page, not this route.
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: studentId } = await params;
  const feePayments = await db.feePayment.findMany({
    where: { studentId },
    orderBy: { dueDate: "desc" },
  });

  return NextResponse.json({ feePayments });
}

// POST /api/students/[id]/fee-payments -- admin records a new fee due
// (e.g. this month's tuition). Recording an actual payment against an
// existing due is a separate action -- see
// src/app/api/fee-payments/[id]/route.ts.
export async function POST(request: Request, { params }: RouteParams) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: studentId } = await params;
  const body = await request.json();
  const parsed = createFeePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { amountDue, dueDate, notes } = parsed.data;

  const feePayment = await db.feePayment.create({
    data: {
      studentId,
      amountDue,
      dueDate: new Date(dueDate),
      status: "PENDING",
      recordedBy: currentUser.id,
      notes: notes || null,
    },
  });

  return NextResponse.json({ feePayment }, { status: 201 });
}
