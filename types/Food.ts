import { z } from "zod";
import { NutritionSchema } from "./Nutrition";

export const FoodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.string(),
  nutrition: NutritionSchema,
  confidence: z.number().min(0).max(1).optional(),
});
export type FoodItem = z.infer<typeof FoodItemSchema>;
