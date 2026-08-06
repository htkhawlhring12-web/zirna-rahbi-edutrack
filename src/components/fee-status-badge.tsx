import { getEffectiveFeeStatus, FEE_STATUS_STYLES, type FeePaymentLike } from "@/lib/fee-status";

const LABELS: Record<string, string> = {
  PAID: "Paid",
  PARTIAL: "Partial",
  OVERDUE: "Overdue",
  PENDING: "Pending",
};

export function FeeStatusBadge({ payment }: { payment: FeePaymentLike }) {
  const status = getEffectiveFeeStatus(payment);
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${FEE_STATUS_STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
