import { z } from "zod";

const CLASS_LEVELS = [
  "CLASS_8",
  "CLASS_9",
  "CLASS_10",
  "CLASS_11",
  "CLASS_12",
] as const;

export const createStudentSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  classLevel: z.enum(CLASS_LEVELS),
  section: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(), // ISO date string from <input type="date">
  admissionDate: z.string().trim().optional(),
  schoolName: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export const updateStudentSchema = createStudentSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const assignSubjectSchema = z.object({
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid().optional(),
});

export const bulkAssignSubjectSchema = z.object({
  classLevel: z.enum(CLASS_LEVELS),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type AssignSubjectInput = z.infer<typeof assignSubjectSchema>;
export type BulkAssignSubjectInput = z.infer<typeof bulkAssignSubjectSchema>;
