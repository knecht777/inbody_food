import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Goal } from "@/types/Goal";
import type { Nutrition } from "@/types/Nutrition";

function goalsRef(uid: string) {
  return collection(db, "users", uid, "goals");
}

export async function getActiveGoal(uid: string): Promise<Goal | null> {
  const q = query(goalsRef(uid), where("isActive", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : (snapshot.docs[0].data() as Goal);
}

export async function setActiveGoal(
  uid: string,
  targetWeightKg: number,
  targets: Nutrition,
): Promise<void> {
  const existingActive = await getDocs(query(goalsRef(uid), where("isActive", "==", true)));

  const batch = writeBatch(db);
  for (const d of existingActive.docs) {
    batch.update(d.ref, { isActive: false });
  }

  const ref = doc(goalsRef(uid));
  const now = new Date().toISOString();
  const goal: Goal = {
    id: ref.id,
    userId: uid,
    targetWeightKg,
    targetCalories: targets.calories,
    targetProtein: targets.protein,
    targetCarbs: targets.carbs,
    targetFat: targets.fat,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  batch.set(ref, goal);

  await batch.commit();
}
