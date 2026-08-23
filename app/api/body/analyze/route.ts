import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeImageWithGemini } from "@/lib/ai/gemini";
import { adminAuth } from "@/lib/firebase/admin";
import { INBODY_ANALYSIS_SYSTEM_PROMPT } from "@/prompts/inbody-analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

const AnalysisResponseSchema = z.object({
  weightKg: z.number().nullable(),
  skeletalMuscleMassKg: z.number().nullable(),
  bodyFatMassKg: z.number().nullable(),
  bodyFatPercent: z.number().nullable(),
  bmi: z.number().nullable(),
  confidence: z.number().min(0).max(1).optional(),
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
      systemPrompt: INBODY_ANALYSIS_SYSTEM_PROMPT,
      userPrompt: "이 인바디 측정 결과 사진에서 수치를 읽어 주세요.",
      imageBase64,
      mediaType,
    });
  } catch (error) {
    console.error("InBody analysis failed", error);
    return NextResponse.json({ error: "AI 분석에 실패했습니다." }, { status: 502 });
  }

  try {
    const jsonText = rawText.trim().replace(/^```(json)?/, "").replace(/```$/, "").trim();
    const parsed = AnalysisResponseSchema.parse(JSON.parse(jsonText));
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to parse InBody analysis response", error, rawText);
    return NextResponse.json({ error: "AI 응답을 해석하지 못했습니다." }, { status: 502 });
  }
}
