import { z } from "zod";

export const NotionSyncLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dateId: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["success", "failed"]),
  notionPageUrl: z.string().url().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type NotionSyncLog = z.infer<typeof NotionSyncLogSchema>;
