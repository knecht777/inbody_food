import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { NotionSyncLog } from "@/types/NotionSyncLog";

function notionSyncLogsRef(uid: string) {
  return collection(db, "users", uid, "notionSyncLogs");
}

async function logSync(
  uid: string,
  dateId: string,
  result: { status: "success"; notionPageUrl: string } | { status: "failed"; errorMessage: string },
): Promise<void> {
  const ref = doc(notionSyncLogsRef(uid));
  const log: NotionSyncLog = {
    id: ref.id,
    userId: uid,
    dateId,
    createdAt: new Date().toISOString(),
    ...result,
  };
  await setDoc(ref, log);
}

export async function syncDayToNotion(
  user: { uid: string; getIdToken: () => Promise<string> },
  params: {
    dateId: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    weightKg: number | null;
    summary: string;
    recommendations: string[];
  },
): Promise<string> {
  const idToken = await user.getIdToken();

  try {
    const response = await fetch("/api/notion/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? "Notion 동기화에 실패했습니다.");
    }

    const { notionPageUrl } = (await response.json()) as { notionPageUrl: string };
    await logSync(user.uid, params.dateId, { status: "success", notionPageUrl });
    return notionPageUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notion 동기화에 실패했습니다.";
    await logSync(user.uid, params.dateId, { status: "failed", errorMessage: message });
    throw error;
  }
}
