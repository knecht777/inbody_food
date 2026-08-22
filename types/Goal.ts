import { z } from "zod";

export const GoalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  targetWeightKg: z.number().positive(),
  targetDate: z.string().datetime().optional(),
  targetCalories: z.number().nonnegative(),
  targetProtein: z.number().nonnegative(),
  targetCarbs: z.number().nonnegative(),
  targetFat: z.number().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Goal = z.infer<typeof GoalSchema>;
