import { z } from "zod";

const CLASS_LEVELS = [
  "CLASS_8",
  "CLASS_9",
  "CLASS_10",
  "CLASS_11",
  "CLASS_12",
] as const;

export const assessmentTypeEnum = z.enum([
  "WEEKLY_TEST",
  "MONTHLY_TEST",
  "EXAM",
]);

export const createAssessmentSchema = z.object({
  subjectId: z.string().uuid(),
  classLevel: z.enum(CLASS_LEVELS),
  title: z.string().trim().min(2, "Title is required"),
  assessmentType: assessmentTypeEnum,
  maxMarks: z.coerce.number().positive("Max marks must be greater than 0"),
  date: z.string().trim().min(1, "Date is required"),
  chapterTopic: z.string().trim().optional(),
});

export const submitMarksSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        marksObtained: z.coerce.number().min(0, "Marks can't be negative"),
        remarks: z.string().trim().optional(),
      })
    )
    .min(1, "At least one mark is required"),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type SubmitMarksInput = z.infer<typeof submitMarksSchema>;
