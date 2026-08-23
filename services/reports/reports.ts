import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getActiveGoal } from "@/services/body/goals";
import { listDailyNutritionInRange } from "@/services/nutrition/dailyNutrition";
import { listWeightLogsInRange } from "@/services/body/weightLogs";
import type { Nutrition } from "@/types/Nutrition";
import type { MonthlyReport, WeeklyReport } from "@/types/Report";

function weeklyReportsRef(uid: string) {
  return collection(db, "users", uid, "weeklyReports");
}

function monthlyReportsRef(uid: string) {
  return collection(db, "users", uid, "monthlyReports");
}

export async function gatherPeriodData(uid: string, startDateId: string, endDateId: string) {
  const [days, weightLogs, goal] = await Promise.all([
    listDailyNutritionInRange(uid, startDateId, endDateId),
    listWeightLogsInRange(uid, startDateId, endDateId),
    getActiveGoal(uid),
  ]);

  const daysWithData = days.filter((d) => d.mealCount > 0).length;
  const totals = days.reduce(
    (acc, d) => ({
      calories: acc.calories + d.calories,
      protein: acc.protein + d.protein,
      carbs: acc.carbs + d.carbs,
      fat: acc.fat + d.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const divisor = Math.max(1, daysWithData);
  const averageNutrition: Nutrition = {
    calories: Math.round(totals.calories / divisor),
    protein: Math.round(totals.protein / divisor),
    carbs: Math.round(totals.carbs / divisor),
    fat: Math.round(totals.fat / divisor),
  };

  const weightChangeKg =
    weightLogs.length >= 2
      ? Math.round((weightLogs.at(-1)!.weightKg - weightLogs[0].weightKg) * 10) / 10
      : null;

  return {
    daysWithData,
    averageNutrition,
    targetCalories: goal?.targetCalories ?? 0,
    weightChangeKg,
  };
}

export async function saveWeeklyReport(
  uid: string,
  weekId: string,
  startDateId: string,
  endDateId: string,
  averageNutrition: Nutrition,
  weightChangeKg: number | null,
  summary: string,
): Promise<WeeklyReport> {
  const report: WeeklyReport = {
    id: weekId,
    userId: uid,
    weekId,
    startDate: startDateId,
    endDate: endDateId,
    averageNutrition,
    ...(weightChangeKg !== null ? { weightChangeKg } : {}),
    summary,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(weeklyReportsRef(uid), weekId), report);
  return report;
}

export async function getWeeklyReport(uid: string, weekId: string): Promise<WeeklyReport | null> {
  const snapshot = await getDoc(doc(weeklyReportsRef(uid), weekId));
  return snapshot.exists() ? (snapshot.data() as WeeklyReport) : null;
}

export async function saveMonthlyReport(
  uid: string,
  monthId: string,
  startDateId: string,
  endDateId: string,
  averageNutrition: Nutrition,
  weightChangeKg: number | null,
  summary: string,
): Promise<MonthlyReport> {
  const report: MonthlyReport = {
    id: monthId,
    userId: uid,
    monthId,
    startDate: startDateId,
    endDate: endDateId,
    averageNutrition,
    ...(weightChangeKg !== null ? { weightChangeKg } : {}),
    summary,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(monthlyReportsRef(uid), monthId), report);
  return report;
}

export async function getMonthlyReport(
  uid: string,
  monthId: string,
): Promise<MonthlyReport | null> {
  const snapshot = await getDoc(doc(monthlyReportsRef(uid), monthId));
  return snapshot.exists() ? (snapshot.data() as MonthlyReport) : null;
}
