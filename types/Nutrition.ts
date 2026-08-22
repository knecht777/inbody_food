import { z } from "zod";

export const NutritionSchema = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});
export type Nutrition = z.infer<typeof NutritionSchema>;

export const DailyNutritionSchema = NutritionSchema.extend({
  dateId: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetCalories: z.number().nonnegative(),
  targetProtein: z.number().nonnegative(),
  targetCarbs: z.number().nonnegative(),
  targetFat: z.number().nonnegative(),
  mealCount: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
});
export type DailyNutrition = z.infer<typeof DailyNutritionSchema>;
