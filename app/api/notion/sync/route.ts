import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";
import { createHealthRecordPage } from "@/lib/notion/client";

export const runtime = "nodejs";

const RequestBodySchema = z.object({
  dateId: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  weightKg: z.number().nullable(),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const decodedToken = await requireAuth(request);
  if (!decodedToken) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const parsedBody = RequestBodySchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "요청 데이터가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const notionPageUrl = await createHealthRecordPage(parsedBody.data);
    return NextResponse.json({ notionPageUrl });
  } catch (error) {
    console.error("Notion sync failed", error);
    return NextResponse.json({ error: "Notion 동기화에 실패했습니다." }, { status: 502 });
  }
}
