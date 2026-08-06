import { z } from "zod";

export const attendanceStatusEnum = z.enum([
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
]);

export const submitAttendanceSchema = z.object({
  date: z.string().trim().min(1, "Date is required"), // ISO date, e.g. 2026-08-02
  subjectId: z.string().uuid().nullable().optional(), // null/omitted = whole-day
  records: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        status: attendanceStatusEnum,
      })
    )
    .min(1, "At least one attendance record is required"),
});

export type SubmitAttendanceInput = z.infer<typeof submitAttendanceSchema>;
