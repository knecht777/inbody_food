import "server-only";

const NOTION_API_URL = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

function notionHeaders() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error("NOTION_API_KEY is not configured");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

export async function createHealthRecordPage(params: {
  dateId: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weightKg: number | null;
  summary: string;
  recommendations: string[];
}): Promise<string> {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) throw new Error("NOTION_DATABASE_ID is not configured");

  const response = await fetch(`${NOTION_API_URL}/pages`, {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        이름: { title: [{ text: { content: params.dateId } }] },
        날짜: { date: { start: params.dateId } },
        칼로리: { number: params.calories },
        단백질: { number: params.protein },
        탄수화물: { number: params.carbs },
        지방: { number: params.fat },
        ...(params.weightKg !== null ? { 체중: { number: params.weightKg } } : {}),
        요약: { rich_text: [{ text: { content: params.summary.slice(0, 2000) } }] },
        추천: {
          rich_text: [{ text: { content: params.recommendations.join(" / ").slice(0, 2000) } }],
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Notion API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.url as string;
}
