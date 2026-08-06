import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { getEffectiveFeeStatus } from "@/lib/fee-status";
import { CLASS_LABELS } from "@/lib/constants";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return new Response("Unauthorized", { status: 403 });
  }

  const payments = await db.feePayment.findMany({
    include: { student: true },
    orderBy: { dueDate: "desc" },
  });

  const rows = payments.map((p) => ({
    studentName: p.student.fullName,
    classLevel: CLASS_LABELS[p.student.classLevel] ?? p.student.classLevel,
    amountDue: Number(p.amountDue),
    amountPaid: Number(p.amountPaid),
    dueDate: p.dueDate.toISOString().slice(0, 10),
    paidDate: p.paidDate ? p.paidDate.toISOString().slice(0, 10) : "",
    status: getEffectiveFeeStatus({
      status: p.status,
      dueDate: p.dueDate,
      amountDue: Number(p.amountDue),
      amountPaid: Number(p.amountPaid),
    }),
    paymentMethod: p.paymentMethod ?? "",
    notes: p.notes ?? "",
  }));

  const csv = toCsv(rows, [
    { key: "studentName", label: "Student" },
    { key: "classLevel", label: "Class" },
    { key: "amountDue", label: "Amount Due" },
    { key: "amountPaid", label: "Amount Paid" },
    { key: "dueDate", label: "Due Date" },
    { key: "paidDate", label: "Paid Date" },
    { key: "status", label: "Status" },
    { key: "paymentMethod", label: "Payment Method" },
    { key: "notes", label: "Notes" },
  ]);

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `fee-payments-${date}.csv`);
}
