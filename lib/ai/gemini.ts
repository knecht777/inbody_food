import "server-only";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

async function callGemini(systemPrompt: string, parts: object[]): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured");
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini response contained no text content");
  }
  return text as string;
}

export function analyzeImageWithGemini(params: {
  systemPrompt: string;
  userPrompt: string;
  imageBase64: string;
  mediaType: string;
}): Promise<string> {
  return callGemini(params.systemPrompt, [
    { text: params.userPrompt },
    { inlineData: { mimeType: params.mediaType, data: params.imageBase64 } },
  ]);
}

export function generateTextWithGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  return callGemini(systemPrompt, [{ text: userPrompt }]);
}
