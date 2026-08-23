"use client";

import { useEffect, useState, type FormEvent } from "react";
import { NutrientBar } from "@/components/NutrientBar";
import { WeightTrendChart } from "@/components/WeightTrendChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { addWeightLog, listWeightLogs } from "@/services/body/weightLogs";
import { dateIdFor, getDailyNutrition } from "@/services/nutrition/dailyNutrition";
import type { DailyNutrition } from "@/types/Nutrition";
import type { WeightLog } from "@/types/WeightLog";

const RANGE_OPTIONS = [
  { days: 7, label: "7일" },
  { days: 30, label: "30일" },
  { days: 90, label: "90일" },
  { days: 365, label: "1년" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [rangeDays, setRangeDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [weightInput, setWeightInput] = useState("");
  const [logging, setLogging] = useState(false);

  async function refreshWeightLogs(uid: string, days: number) {
    setWeightLogs(await listWeightLogs(uid, days));
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getDailyNutrition(user.uid, dateIdFor(new Date())),
      listWeightLogs(user.uid, rangeDays),
    ]).then(([nutrition, logs]) => {
      if (cancelled) return;
      setDailyNutrition(nutrition);
      setWeightLogs(logs);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, rangeDays]);

  async function handleLogWeight(event: FormEvent) {
    event.preventDefault();
    if (!user || !weightInput) return;
    setLogging(true);
    await addWeightLog(user.uid, Number(weightInput));
    setWeightInput("");
    await refreshWeightLogs(user.uid, rangeDays);
    setLogging(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>;
  }

  const nutrition = dailyNutrition ?? {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    targetCalories: 0,
    targetProtein: 0,
    targetCarbs: 0,
    targetFat: 0,
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>오늘의 영양</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <NutrientBar
            label="칼로리"
            current={nutrition.calories}
            target={nutrition.targetCalories}
            unit="kcal"
          />
          <NutrientBar
            label="단백질"
            current={nutrition.protein}
            target={nutrition.targetProtein}
            unit="g"
          />
          <NutrientBar
            label="탄수화물"
            current={nutrition.carbs}
            target={nutrition.targetCarbs}
            unit="g"
          />
          <NutrientBar label="지방" current={nutrition.fat} target={nutrition.targetFat} unit="g" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>체중 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogWeight} className="flex gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder="오늘 체중 (kg)"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
            />
            <Button type="submit" disabled={logging || !weightInput}>
              {logging ? "기록 중..." : "기록"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>체중 추이</CardTitle>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setRangeDays(opt.days)}
                className={`rounded-md px-2 py-1 text-xs ${
                  rangeDays === opt.days
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <WeightTrendChart logs={weightLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
