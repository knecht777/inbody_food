import { z } from "zod";

export const AIAnalysisSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dateId: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  summary: z.string(),
  recommendations: z.array(z.string()),
  createdAt: z.string().datetime(),
});
export type AIAnalysis = z.infer<typeof AIAnalysisSchema>;
