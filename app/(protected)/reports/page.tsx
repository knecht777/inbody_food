"use client";

import { CalendarDays, CalendarRange } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { monthIdFor, monthRange, weekIdFor, weekRange } from "@/lib/health/dates";
import {
  gatherPeriodData,
  getMonthlyReport,
  getWeeklyReport,
  saveMonthlyReport,
  saveWeeklyReport,
} from "@/services/reports/reports";
import type { MonthlyReport, WeeklyReport } from "@/types/Report";

async function generateSummary(
  idToken: string,
  periodLabel: string,
  data: {
    daysWithData: number;
    averageNutrition: { calories: number; protein: number; carbs: number; fat: number };
    targetCalories: number;
    weightChangeKg: number | null;
  },
): Promise<string> {
  const response = await fetch("/api/reports/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ periodLabel, ...data }),
  });
  if (!response.ok) throw new Error("report generation failed");
  const { summary } = (await response.json()) as { summary: string };
  return summary;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [weekly, setWeekly] = useState<WeeklyReport | null>(null);
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingWeekly, setGeneratingWeekly] = useState(false);
  const [generatingMonthly, setGeneratingMonthly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekId = weekIdFor(new Date());
  const monthId = monthIdFor(new Date());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([getWeeklyReport(user.uid, weekId), getMonthlyReport(user.uid, monthId)]).then(
      ([w, m]) => {
        if (cancelled) return;
        setWeekly(w);
        setMonthly(m);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [user, weekId, monthId]);

  async function handleGenerateWeekly() {
    if (!user) return;
    setGeneratingWeekly(true);
    setError(null);
    try {
      const { start, end } = weekRange(weekId);
      const data = await gatherPeriodData(user.uid, start, end);
      const idToken = await user.getIdToken();
      const summary = await generateSummary(idToken, `${start} ~ ${end} (이번 주)`, data);
      const saved = await saveWeeklyReport(
        user.uid,
        weekId,
        start,
        end,
        data.averageNutrition,
        data.weightChangeKg,
        summary,
      );
      setWeekly(saved);
    } catch {
      setError("주간 리포트 생성에 실패했습니다.");
    } finally {
      setGeneratingWeekly(false);
    }
  }

  async function handleGenerateMonthly() {
    if (!user) return;
    setGeneratingMonthly(true);
    setError(null);
    try {
      const { start, end } = monthRange(monthId);
      const data = await gatherPeriodData(user.uid, start, end);
      const idToken = await user.getIdToken();
      const summary = await generateSummary(idToken, `${monthId} (이번 달)`, data);
      const saved = await saveMonthlyReport(
        user.uid,
        monthId,
        start,
        end,
        data.averageNutrition,
        data.weightChangeKg,
        summary,
      );
      setMonthly(saved);
    } catch {
      setError("월간 리포트 생성에 실패했습니다.");
    } finally {
      setGeneratingMonthly(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="size-4 text-primary" />
            주간 리포트 ({weekId})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {weekly ? (
            <>
              <p className="text-sm text-muted-foreground">
                {weekly.startDate} ~ {weekly.endDate}
              </p>
              <p className="text-sm">
                평균 칼로리: {weekly.averageNutrition.calories}kcal · 단백질{" "}
                {weekly.averageNutrition.protein}g · 탄수화물 {weekly.averageNutrition.carbs}g ·
                지방 {weekly.averageNutrition.fat}g
              </p>
              {weekly.weightChangeKg !== undefined && (
                <p className="text-sm">
                  체중 변화: {weekly.weightChangeKg > 0 ? "+" : ""}
                  {weekly.weightChangeKg}kg
                </p>
              )}
              <p className="text-sm">{weekly.summary}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">이번 주 리포트가 아직 없습니다.</p>
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-fit"
            onClick={handleGenerateWeekly}
            disabled={generatingWeekly}
          >
            {generatingWeekly ? "생성 중..." : weekly ? "다시 생성" : "이번 주 리포트 생성"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            월간 리포트 ({monthId})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {monthly ? (
            <>
              <p className="text-sm text-muted-foreground">
                {monthly.startDate} ~ {monthly.endDate}
              </p>
              <p className="text-sm">
                평균 칼로리: {monthly.averageNutrition.calories}kcal · 단백질{" "}
                {monthly.averageNutrition.protein}g · 탄수화물 {monthly.averageNutrition.carbs}g ·
                지방 {monthly.averageNutrition.fat}g
              </p>
              {monthly.weightChangeKg !== undefined && (
                <p className="text-sm">
                  체중 변화: {monthly.weightChangeKg > 0 ? "+" : ""}
                  {monthly.weightChangeKg}kg
                </p>
              )}
              <p className="text-sm">{monthly.summary}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">이번 달 리포트가 아직 없습니다.</p>
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-fit"
            onClick={handleGenerateMonthly}
            disabled={generatingMonthly}
          >
            {generatingMonthly ? "생성 중..." : monthly ? "다시 생성" : "이번 달 리포트 생성"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
