import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { FoodItem } from "@/types/Food";
import type { Meal } from "@/types/Meal";
import type { Nutrition } from "@/types/Nutrition";

function mealsRef(uid: string) {
  return collection(db, "users", uid, "meals");
}

function sumNutrition(foodItems: FoodItem[]): Nutrition {
  return foodItems.reduce(
    (total, item) => ({
      calories: total.calories + item.nutrition.calories,
      protein: total.protein + item.nutrition.protein,
      carbs: total.carbs + item.nutrition.carbs,
      fat: total.fat + item.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function newMealId(uid: string): string {
  return doc(mealsRef(uid)).id;
}

export async function createUploadingMeal(
  uid: string,
  mealId: string,
  mealType: Meal["mealType"],
): Promise<void> {
  const now = new Date().toISOString();
  const meal: Meal = {
    id: mealId,
    userId: uid,
    eatenAt: now,
    mealType,
    status: "uploading",
    foodItems: [],
    totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(mealsRef(uid), mealId), meal);
}

export async function markMealAnalyzing(uid: string, mealId: string, imageUrl: string) {
  await updateDoc(doc(mealsRef(uid), mealId), {
    imageUrl,
    status: "analyzing",
    updatedAt: new Date().toISOString(),
  });
}

export async function completeMealAnalysis(uid: string, mealId: string, foodItems: FoodItem[]) {
  await updateDoc(doc(mealsRef(uid), mealId), {
    foodItems,
    totalNutrition: sumNutrition(foodItems),
    status: "completed",
    updatedAt: new Date().toISOString(),
  });
}

export async function markMealSyncFailed(uid: string, mealId: string) {
  await updateDoc(doc(mealsRef(uid), mealId), {
    status: "sync_failed",
    updatedAt: new Date().toISOString(),
  });
}

export async function updateMealFoodItems(uid: string, mealId: string, foodItems: FoodItem[]) {
  await updateDoc(doc(mealsRef(uid), mealId), {
    foodItems,
    totalNutrition: sumNutrition(foodItems),
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteMeal(uid: string, mealId: string) {
  await deleteDoc(doc(mealsRef(uid), mealId));
}

export async function listRecentMeals(uid: string, count = 20): Promise<Meal[]> {
  const q = query(mealsRef(uid), orderBy("eatenAt", "desc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as Meal);
}
