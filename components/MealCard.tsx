"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FoodItem } from "@/types/Food";
import type { Meal } from "@/types/Meal";

const MEAL_TYPE_LABELS: Record<Meal["mealType"], string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

const STATUS_LABELS: Record<Meal["status"], string> = {
  uploading: "업로드 중",
  analyzing: "AI 분석 중",
  completed: "완료",
  sync_pending: "동기화 대기",
  sync_failed: "동기화 실패",
};

export function MealCard({
  meal,
  onSave,
  onDelete,
}: {
  meal: Meal;
  onSave: (foodItems: FoodItem[]) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [foodItems, setFoodItems] = useState<FoodItem[]>(meal.foodItems);
  const [saving, setSaving] = useState(false);

  function updateItem(index: number, patch: Partial<FoodItem>) {
    setFoodItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updateNutrition(index: number, key: keyof FoodItem["nutrition"], value: string) {
    setFoodItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, nutrition: { ...item.nutrition, [key]: Number(value) || 0 } }
          : item,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    await onSave(foodItems);
    setSaving(false);
    setEditing(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          {MEAL_TYPE_LABELS[meal.mealType]} · {new Date(meal.eatenAt).toLocaleString("ko-KR")}
        </CardTitle>
        <span className="text-xs text-muted-foreground">{STATUS_LABELS[meal.status]}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {meal.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={meal.imageUrl}
            alt="식사 사진"
            className="h-40 w-full rounded-md object-cover"
          />
        )}

        {meal.status === "analyzing" && (
          <p className="text-sm text-muted-foreground">AI가 음식을 분석하고 있습니다...</p>
        )}
        {meal.status === "sync_failed" && (
          <p className="text-sm text-destructive">분석에 실패했습니다. 직접 입력해 주세요.</p>
        )}

        {!editing ? (
          <>
            {foodItems.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm">
                {foodItems.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.name} ({item.quantity})
                    </span>
                    <span className="text-muted-foreground">{item.nutrition.calories}kcal</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm font-medium">
              총 {meal.totalNutrition.calories}kcal · 단백질 {meal.totalNutrition.protein}g ·
              탄수화물 {meal.totalNutrition.carbs}g · 지방 {meal.totalNutrition.fat}g
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                수정
              </Button>
              <Button size="sm" variant="outline" onClick={onDelete}>
                삭제
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {foodItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-2 gap-2 rounded-md border p-2">
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  placeholder="음식 이름"
                />
                <Input
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  placeholder="양"
                />
                <Input
                  type="number"
                  value={item.nutrition.calories}
                  onChange={(e) => updateNutrition(index, "calories", e.target.value)}
                  placeholder="칼로리"
                />
                <Input
                  type="number"
                  value={item.nutrition.protein}
                  onChange={(e) => updateNutrition(index, "protein", e.target.value)}
                  placeholder="단백질(g)"
                />
                <Input
                  type="number"
                  value={item.nutrition.carbs}
                  onChange={(e) => updateNutrition(index, "carbs", e.target.value)}
                  placeholder="탄수화물(g)"
                />
                <Input
                  type="number"
                  value={item.nutrition.fat}
                  onChange={(e) => updateNutrition(index, "fat", e.target.value)}
                  placeholder="지방(g)"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                취소
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
