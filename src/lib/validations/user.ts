import { z } from "zod";

export const createStaffSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  role: z.enum(["ADMIN", "TEACHER", "ASSISTANT"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;