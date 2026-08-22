import { z } from "zod";
import { NutritionSchema } from "./Nutrition";

const ReportBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  averageNutrition: NutritionSchema,
  weightChangeKg: z.number().optional(),
  summary: z.string(),
  notionPageUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
});

export const WeeklyReportSchema = ReportBaseSchema.extend({
  weekId: z.string().regex(/^\d{4}-W\d{2}$/),
});
export type WeeklyReport = z.infer<typeof WeeklyReportSchema>;

export const MonthlyReportSchema = ReportBaseSchema.extend({
  monthId: z.string().regex(/^\d{4}-\d{2}$/),
});
export type MonthlyReport = z.infer<typeof MonthlyReportSchema>;
