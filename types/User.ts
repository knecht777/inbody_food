import { z } from "zod";

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const ProfileSchema = z.object({
  userId: z.string(),
  sex: z.enum(["male", "female"]),
  birthYear: z.number().int(),
  heightCm: z.number().positive(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  updatedAt: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;
