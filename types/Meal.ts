import { z } from "zod";
import { FoodItemSchema } from "./Food";
import { NutritionSchema } from "./Nutrition";

export const MealSchema = z.object({
  id: z.string(),
  userId: z.string(),
  eatenAt: z.string().datetime(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  imageUrl: z.string().url().optional(),
  status: z.enum(["uploading", "analyzing", "completed", "sync_pending", "sync_failed"]),
  foodItems: z.array(FoodItemSchema),
  totalNutrition: NutritionSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Meal = z.infer<typeof MealSchema>;
