import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateTextWithGemini } from "@/lib/ai/gemini";
import { adminAuth } from "@/lib/firebase/admin";
import { REPORT_SYSTEM_PROMPT } from "@/prompts/report";
import { NutritionSchema } from "@/types/Nutrition";

export const runtime = "nodejs";

const RequestBodySchema = z.object({
  periodLabel: z.string(),
  daysWithData: z.number(),
  averageNutrition: NutritionSchema,
  targetCalories: z.number(),
  weightChangeKg: z.number().nullable(),
});

const ResponseSchema = z.object({ summary: z.string() });

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
  const { periodLabel, daysWithData, averageNutrition, targetCalories, weightChangeKg } =
    parsedBody.data;

  const userPrompt = `기간: ${periodLabel}
기록이 있는 날: ${daysWithData}일
평균 칼로리: ${averageNutrition.calories}kcal (목표 ${targetCalories}kcal)
평균 단백질: ${averageNutrition.protein}g
평균 탄수화물: ${averageNutrition.carbs}g
평균 지방: ${averageNutrition.fat}g
체중 변화: ${weightChangeKg !== null ? `${weightChangeKg > 0 ? "+" : ""}${weightChangeKg}kg` : "기록 없음"}`;

  let rawText: string;
  try {
    rawText = await generateTextWithGemini(REPORT_SYSTEM_PROMPT, userPrompt);
  } catch (error) {
    console.error("Report generation failed", error);
    return NextResponse.json({ error: "리포트 생성에 실패했습니다." }, { status: 502 });
  }

  try {
    const jsonText = rawText.trim().replace(/^```(json)?/, "").replace(/```$/, "").trim();
    const parsed = ResponseSchema.parse(JSON.parse(jsonText));
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to parse report response", error, rawText);
    return NextResponse.json({ error: "AI 응답을 해석하지 못했습니다." }, { status: 502 });
  }
}
