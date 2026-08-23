import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateTextWithGemini } from "@/lib/ai/gemini";
import { adminAuth } from "@/lib/firebase/admin";
import { HEALTH_COACH_SYSTEM_PROMPT } from "@/prompts/health-coach";
import { DailyNutritionSchema } from "@/types/Nutrition";

export const runtime = "nodejs";

const AnalysisResponseSchema = z.object({
  summary: z.string(),
  recommendations: z.array(z.string()).min(1).max(6),
});

const RequestBodySchema = z.object({
  dailyNutrition: DailyNutritionSchema.nullable(),
  recentWeightsKg: z.array(z.number()),
  targetWeightKg: z.number().nullable(),
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
  const { dailyNutrition, recentWeightsKg, targetWeightKg } = parsedBody.data;

  const userPrompt = `오늘 데이터:
${
  dailyNutrition
    ? `- 칼로리: ${dailyNutrition.calories}kcal (목표 ${dailyNutrition.targetCalories}kcal)
- 단백질: ${dailyNutrition.protein}g (목표 ${dailyNutrition.targetProtein}g)
- 탄수화물: ${dailyNutrition.carbs}g (목표 ${dailyNutrition.targetCarbs}g)
- 지방: ${dailyNutrition.fat}g (목표 ${dailyNutrition.targetFat}g)
- 오늘 기록된 식사 수: ${dailyNutrition.mealCount}`
    : "- 오늘 기록된 식사가 없습니다."
}

최근 체중 기록(kg, 오래된 순): ${recentWeightsKg.length > 0 ? recentWeightsKg.join(", ") : "기록 없음"}
목표 체중: ${targetWeightKg ?? "설정 안 됨"}kg`;

  let rawText: string;
  try {
    rawText = await generateTextWithGemini(HEALTH_COACH_SYSTEM_PROMPT, userPrompt);
  } catch (error) {
    console.error("Health coach analysis failed", error);
    return NextResponse.json({ error: "AI 분석에 실패했습니다." }, { status: 502 });
  }

  try {
    const jsonText = rawText.trim().replace(/^```(json)?/, "").replace(/```$/, "").trim();
    const parsed = AnalysisResponseSchema.parse(JSON.parse(jsonText));
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to parse health coach response", error, rawText);
    return NextResponse.json({ error: "AI 응답을 해석하지 못했습니다." }, { status: 502 });
  }
}
