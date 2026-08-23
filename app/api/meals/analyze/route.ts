import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeImageWithGemini } from "@/lib/ai/gemini";
import { adminAuth } from "@/lib/firebase/admin";
import { MEAL_ANALYSIS_SYSTEM_PROMPT } from "@/prompts/meal-analysis";
import { NutritionSchema } from "@/types/Nutrition";

export const runtime = "nodejs";

const AnalysisResponseSchema = z.object({
  foodItems: z.array(
    z.object({
      name: z.string(),
      quantity: z.string(),
      nutrition: NutritionSchema,
      confidence: z.number().min(0).max(1).optional(),
    }),
  ),
});

const RequestBodySchema = z.object({
  imageUrl: z.string().url(),
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
    return NextResponse.json({ error: "imageUrl이 필요합니다." }, { status: 400 });
  }

  const imageResponse = await fetch(parsedBody.data.imageUrl);
  if (!imageResponse.ok) {
    return NextResponse.json({ error: "이미지를 불러오지 못했습니다." }, { status: 400 });
  }
  const mediaType = imageResponse.headers.get("content-type") ?? "image/jpeg";
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBase64 = Buffer.from(imageBuffer).toString("base64");

  let rawText: string;
  try {
    rawText = await analyzeImageWithGemini({
      systemPrompt: MEAL_ANALYSIS_SYSTEM_PROMPT,
      userPrompt: "이 사진 속 음식을 분석해 주세요.",
      imageBase64,
      mediaType,
    });
  } catch (error) {
    console.error("AI analysis failed", error);
    return NextResponse.json({ error: "AI 분석에 실패했습니다." }, { status: 502 });
  }

  let parsedAnalysis;
  try {
    const jsonText = rawText.trim().replace(/^```(json)?/, "").replace(/```$/, "").trim();
    parsedAnalysis = AnalysisResponseSchema.parse(JSON.parse(jsonText));
  } catch (error) {
    console.error("Failed to parse AI response", error, rawText);
    return NextResponse.json({ error: "AI 응답을 해석하지 못했습니다." }, { status: 502 });
  }

  const foodItems = parsedAnalysis.foodItems.map((item) => ({
    id: randomUUID(),
    ...item,
  }));

  return NextResponse.json({ foodItems });
}
