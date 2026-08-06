export type FeePaymentLike = {
  status: string;
  dueDate: Date;
  amountDue: number;
  amountPaid: number;
};

export type EffectiveFeeStatus = "PAID" | "PARTIAL" | "OVERDUE" | "PENDING";

/**
 * The stored `status` column only ever gets set to PENDING, PARTIAL, or
 * PAID by an explicit admin action (see the record-payment API route) --
 * never OVERDUE, because "overdue" is purely a function of today's date
 * versus the due date, and would go stale the moment midnight passes
 * without a scheduled job to update it. Instead, every UI that shows a
 * fee's status calls this function, so "overdue" is always accurate at
 * the moment someone looks, with zero background jobs required.
 */
export function getEffectiveFeeStatus(payment: FeePaymentLike): EffectiveFeeStatus {
  if (payment.amountPaid >= payment.amountDue && payment.amountDue > 0) return "PAID";
  if (payment.dueDate.getTime() < Date.now()) return "OVERDUE";
  if (payment.amountPaid > 0) return "PARTIAL";
  return "PENDING";
}

export const FEE_STATUS_STYLES: Record<EffectiveFeeStatus, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  PENDING: "bg-slate-50 text-slate-600 border-slate-200",
};
