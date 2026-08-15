import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordFeePaymentSchema } from "@/lib/validations/fee";

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/fee-payments/[id] -- record a payment (full or partial)
// against an existing due, and/or correct the amount due / due date.
// amountPaid replaces the running total rather than adding to it, since
// re-editing a mistaken entry should be possible without creating
// duplicate partial-payment rows.
export async function PATCH(request: Request, { params }: RouteParams) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.feePayment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Fee payment not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = recordFeePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { amountPaid, paymentMethod, notes } = parsed.data;

  // Optional corrections -- editing the due itself, not the payment.
  const amountDueRaw = body.amountDue;
  const dueDateRaw = body.dueDate;
  const amountDue =
    amountDueRaw !== undefined && amountDueRaw !== null && amountDueRaw !== ""
      ? Number(amountDueRaw)
      : Number(existing.amountDue);
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : existing.dueDate;

  const status = amountPaid >= amountDue ? "PAID" : amountPaid > 0 ? "PARTIAL" : "PENDING";

  const feePayment = await db.feePayment.update({
    where: { id },
    data: {
      amountDue,
      dueDate,
      amountPaid,
      status,
      paidDate: amountPaid > 0 ? new Date() : null,
      paymentMethod: paymentMethod || null,
      notes: notes || existing.notes,
      recordedBy: currentUser.id,
    },
  });

  return NextResponse.json({ feePayment });
}

// DELETE /api/fee-payments/[id] -- remove a fee due entirely. For fixing
// accidental duplicates -- use PATCH instead if you just need to correct
// the amount or date on an existing due.
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.feePayment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Fee payment not found" }, { status: 404 });
  }

  await db.feePayment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}