import { z } from "zod";

export const generateReportCardSchema = z.object({
  periodLabel: z.string().trim().min(2, "Period label is required"),
  sinceDate: z.string().trim().optional(),
  untilDate: z.string().trim().optional(),
});

export type GenerateReportCardInput = z.infer<typeof generateReportCardSchema>;
