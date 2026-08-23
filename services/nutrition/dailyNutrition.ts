import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { dateIdFor } from "@/lib/health/dates";
import { getActiveGoal } from "@/services/body/goals";
import type { DailyNutrition } from "@/types/Nutrition";
import type { Meal } from "@/types/Meal";

export { dateIdFor };

function dailyNutritionRef(uid: string) {
  return collection(db, "users", uid, "dailyNutrition");
}

function mealsRef(uid: string) {
  return collection(db, "users", uid, "meals");
}

function dailyNutritionDoc(uid: string, dateId: string) {
  return doc(db, "users", uid, "dailyNutrition", dateId);
}

export async function getDailyNutrition(
  uid: string,
  dateId: string,
): Promise<DailyNutrition | null> {
  const snapshot = await getDoc(dailyNutritionDoc(uid, dateId));
  return snapshot.exists() ? (snapshot.data() as DailyNutrition) : null;
}

export async function listDailyNutritionInRange(
  uid: string,
  startDateId: string,
  endDateId: string,
): Promise<DailyNutrition[]> {
  const q = query(
    dailyNutritionRef(uid),
    where("dateId", ">=", startDateId),
    where("dateId", "<=", endDateId),
    orderBy("dateId", "asc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as DailyNutrition);
}

export async function recalculateDailyNutrition(uid: string, dateId: string): Promise<void> {
  const dayStart = `${dateId}T00:00:00.000Z`;
  const dayEnd = `${dateId}T23:59:59.999Z`;

  const q = query(
    mealsRef(uid),
    where("eatenAt", ">=", dayStart),
    where("eatenAt", "<=", dayEnd),
  );
  const snapshot = await getDocs(q);
  const meals = snapshot.docs.map((d) => d.data() as Meal);

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totalNutrition.calories,
      protein: acc.protein + meal.totalNutrition.protein,
      carbs: acc.carbs + meal.totalNutrition.carbs,
      fat: acc.fat + meal.totalNutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const goal = await getActiveGoal(uid);

  const dailyNutrition: DailyNutrition = {
    dateId,
    ...totals,
    targetCalories: goal?.targetCalories ?? 0,
    targetProtein: goal?.targetProtein ?? 0,
    targetCarbs: goal?.targetCarbs ?? 0,
    targetFat: goal?.targetFat ?? 0,
    mealCount: meals.length,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(dailyNutritionDoc(uid, dateId), dailyNutrition);
}
