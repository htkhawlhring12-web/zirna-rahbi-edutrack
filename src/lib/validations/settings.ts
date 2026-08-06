import { z } from "zod";

export const updateAtRiskSettingsSchema = z.object({
  attendanceWindowDays: z.coerce.number().int().min(1).max(365),
  attendanceThresholdPercent: z.coerce.number().int().min(0).max(100),
  averageRecentCount: z.coerce.number().int().min(1).max(50),
  averageThresholdPercent: z.coerce.number().int().min(0).max(100),
  consecutiveAbsencesThreshold: z.coerce.number().int().min(1).max(30),
  trendWindowCount: z.coerce.number().int().min(1).max(20),
  trendDeclineThresholdPoints: z.coerce.number().int().min(0).max(100),
});

export type UpdateAtRiskSettingsInput = z.infer<typeof updateAtRiskSettingsSchema>;
