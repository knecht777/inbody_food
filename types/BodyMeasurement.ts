import { z } from "zod";

export const BodyMeasurementSchema = z.object({
  id: z.string(),
  userId: z.string(),
  measuredAt: z.string().datetime(),
  weightKg: z.number().positive(),
  skeletalMuscleMassKg: z.number().positive().optional(),
  bodyFatMassKg: z.number().positive().optional(),
  bodyFatPercent: z.number().min(0).max(100).optional(),
  bmi: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  source: z.enum(["inbody_photo", "manual"]),
  createdAt: z.string().datetime(),
});
export type BodyMeasurement = z.infer<typeof BodyMeasurementSchema>;
