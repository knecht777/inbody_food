import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { AIAnalysis } from "@/types/AIAnalysis";

function aiAnalysesRef(uid: string) {
  return collection(db, "users", uid, "aiAnalyses");
}

export async function getAIAnalysis(uid: string, dateId: string): Promise<AIAnalysis | null> {
  const snapshot = await getDoc(doc(aiAnalysesRef(uid), dateId));
  return snapshot.exists() ? (snapshot.data() as AIAnalysis) : null;
}

export async function saveAIAnalysis(
  uid: string,
  dateId: string,
  summary: string,
  recommendations: string[],
): Promise<AIAnalysis> {
  const analysis: AIAnalysis = {
    id: dateId,
    userId: uid,
    dateId,
    summary,
    recommendations,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(aiAnalysesRef(uid), dateId), analysis);
  return analysis;
}
