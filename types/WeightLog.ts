import { z } from "zod";

export const WeightLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  loggedAt: z.string().datetime(),
  weightKg: z.number().positive(),
  note: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type WeightLog = z.infer<typeof WeightLogSchema>;
