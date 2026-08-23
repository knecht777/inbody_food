import { collection, doc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { WeightLog } from "@/types/WeightLog";

function weightLogsRef(uid: string) {
  return collection(db, "users", uid, "weightLogs");
}

export async function addWeightLog(uid: string, weightKg: number): Promise<void> {
  const ref = doc(weightLogsRef(uid));
  const now = new Date().toISOString();
  const log: WeightLog = {
    id: ref.id,
    userId: uid,
    loggedAt: now,
    weightKg,
    createdAt: now,
  };
  await setDoc(ref, log);
}

export async function listWeightLogs(uid: string, sinceDays: number): Promise<WeightLog[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - sinceDays);

  const q = query(
    weightLogsRef(uid),
    where("loggedAt", ">=", cutoff.toISOString()),
    orderBy("loggedAt", "asc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as WeightLog);
}
