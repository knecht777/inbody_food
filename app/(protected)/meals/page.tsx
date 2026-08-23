"use client";

import { Camera } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { MealCard } from "@/components/MealCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { uploadMealPhoto } from "@/lib/blob/upload";
import {
  completeMealAnalysis,
  createUploadingMeal,
  deleteMeal,
  listRecentMeals,
  markMealAnalyzing,
  markMealSyncFailed,
  newMealId,
  updateMealFoodItems,
} from "@/services/meal/meals";
import type { FoodItem } from "@/types/Food";
import type { Meal } from "@/types/Meal";

const MEAL_TYPE_LABELS: Record<Meal["mealType"], string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

export default function MealsPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealType, setMealType] = useState<Meal["mealType"]>("lunch");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh(uid: string) {
    const list = await listRecentMeals(uid);
    setMeals(list);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listRecentMeals(user.uid).then((list) => {
      if (!cancelled) {
        setMeals(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!user || !file) return;

    setUploading(true);
    setError(null);
    const mealId = newMealId(user.uid);
    const eatenAt = new Date().toISOString();

    try {
      await createUploadingMeal(user.uid, mealId, mealType, eatenAt);
      await refresh(user.uid);

      const imageUrl = await uploadMealPhoto(user, mealId, file);
      await markMealAnalyzing(user.uid, mealId, imageUrl);
      await refresh(user.uid);

      const idToken = await user.getIdToken();
      const response = await fetch("/api/meals/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) throw new Error("analysis failed");
      const { foodItems } = (await response.json()) as { foodItems: FoodItem[] };
      await completeMealAnalysis(user.uid, mealId, foodItems, eatenAt);
    } catch {
      await markMealSyncFailed(user.uid, mealId);
      setError("AI 분석에 실패했습니다. 사진은 저장되었으니 직접 입력해 주세요.");
    } finally {
      setFile(null);
      setUploading(false);
      await refresh(user.uid);
    }
  }

  async function handleSaveItems(mealId: string, eatenAt: string, foodItems: FoodItem[]) {
    if (!user) return;
    await updateMealFoodItems(user.uid, mealId, foodItems, eatenAt);
    await refresh(user.uid);
  }

  async function handleDelete(mealId: string, eatenAt: string) {
    if (!user) return;
    await deleteMeal(user.uid, mealId, eatenAt);
    await refresh(user.uid);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="size-4 text-primary" />
            식사 사진 업로드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>식사 종류</Label>
              <Select value={mealType} onValueChange={(v) => setMealType(v as Meal["mealType"])}>
                <SelectTrigger>
                  <SelectValue>
                    {(v: Meal["mealType"]) => MEAL_TYPE_LABELS[v]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="photo">사진</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={uploading || !file}>
              {uploading ? "업로드 및 분석 중..." : "업로드"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : meals.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 등록된 식사가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onSave={(foodItems) => handleSaveItems(meal.id, meal.eatenAt, foodItems)}
              onDelete={() => handleDelete(meal.id, meal.eatenAt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
