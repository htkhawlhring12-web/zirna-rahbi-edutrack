import { z } from "zod";

// Used when the admin creates a brand-new parent account and links it to
// a student in one step (the common case: enrolling a new student).
// The admin/assistant types a password directly here and shares it with
// the parent in person -- many parents don't have a checkable email, so
// we don't rely on email delivery at all.
export const createParentAndLinkSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  relationship: z.string().trim().optional(), // "Father", "Mother", "Guardian"
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Used when linking a student to a parent account that already exists
// (e.g. a second child of a family already using the system).
export const linkExistingParentSchema = z.object({
  parentUserId: z.string().uuid(),
  relationship: z.string().trim().optional(),
});

export type CreateParentAndLinkInput = z.infer<typeof createParentAndLinkSchema>;
export type LinkExistingParentInput = z.infer<typeof linkExistingParentSchema>;