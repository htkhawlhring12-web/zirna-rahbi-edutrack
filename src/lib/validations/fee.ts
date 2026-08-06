import { z } from "zod";

const CLASS_LEVELS = [
  "CLASS_8",
  "CLASS_9",
  "CLASS_10",
  "CLASS_11",
  "CLASS_12",
] as const;

export const billingCycleEnum = z.enum(["MONTHLY", "TERM", "ANNUAL"]);

export const createFeeStructureSchema = z.object({
  classLevel: z.enum(CLASS_LEVELS),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  billingCycle: billingCycleEnum,
  effectiveFrom: z.string().trim().min(1, "Effective date is required"),
});

export const createFeePaymentSchema = z.object({
  amountDue: z.coerce.number().positive("Amount due must be greater than 0"),
  dueDate: z.string().trim().min(1, "Due date is required"),
  notes: z.string().trim().optional(),
});

export const bulkCreateFeePaymentSchema = z.object({
  classLevel: z.enum(CLASS_LEVELS),
  amountDue: z.coerce.number().positive("Amount due must be greater than 0"),
  dueDate: z.string().trim().min(1, "Due date is required"),
  notes: z.string().trim().optional(),
});

export const recordFeePaymentSchema = z.object({
  amountPaid: z.coerce.number().min(0, "Amount can't be negative"),
  paymentMethod: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
export type CreateFeePaymentInput = z.infer<typeof createFeePaymentSchema>;
export type BulkCreateFeePaymentInput = z.infer<typeof bulkCreateFeePaymentSchema>;
export type RecordFeePaymentInput = z.infer<typeof recordFeePaymentSchema>;
