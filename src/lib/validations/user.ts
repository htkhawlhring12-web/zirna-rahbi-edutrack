import { z } from "zod";

export const createStaffSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  role: z.enum(["ADMIN", "TEACHER", "ASSISTANT"]),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
