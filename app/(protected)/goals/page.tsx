"use client";

import { CheckCircle2, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { calculateTargets } from "@/lib/health/calculations";
import { getProfile } from "@/lib/firebase/profile";
import { getLatestBodyMeasurement } from "@/services/body/bodyMeasurements";
import { getActiveGoal, setActiveGoal } from "@/services/body/goals";
import type { Goal } from "@/types/Goal";
import type { Nutrition } from "@/types/Nutrition";
import type { Profile } from "@/types/User";

export default function GoalsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentWeightKg, setCurrentWeightKg] = useState<number | null>(null);
  const [activeGoal, setActiveGoalState] = useState<Goal | null>(null);
  const [targetWeightKg, setTargetWeightKg] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getProfile(user.uid),
      getLatestBodyMeasurement(user.uid),
      getActiveGoal(user.uid),
    ]).then(([p, measurement, goal]) => {
      if (cancelled) return;
      setProfile(p);
      setCurrentWeightKg(measurement?.weightKg ?? null);
      setActiveGoalState(goal);
      if (goal) setTargetWeightKg(String(goal.targetWeightKg));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const preview: Nutrition | null = useMemo(() => {
    if (!profile || currentWeightKg === null || !targetWeightKg) return null;
    return calculateTargets(profile, currentWeightKg, Number(targetWeightKg));
  }, [profile, currentWeightKg, targetWeightKg]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || !preview) return;
    setSaving(true);
    setError(null);
    try {
      await setActiveGoal(user.uid, Number(targetWeightKg), preview);
      setActiveGoalState(await getActiveGoal(user.uid));
    } catch {
      setError("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>;
  }

  if (!profile) {
    return (
      <p className="text-sm text-muted-foreground">
        목표를 계산하려면 먼저{" "}
        <Link href="/settings" className="underline">
          프로필
        </Link>
        을 입력해 주세요.
      </p>
    );
  }

  if (currentWeightKg === null) {
    return (
      <p className="text-sm text-muted-foreground">
        목표를 계산하려면 먼저{" "}
        <Link href="/body" className="underline">
          인바디 기록
        </Link>
        을 추가해 주세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-primary" />
            목표 체중 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">현재 체중: {currentWeightKg}kg</p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="targetWeight">목표 체중 (kg)</Label>
              <Input
                id="targetWeight"
                type="number"
                step="0.1"
                required
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(e.target.value)}
              />
            </div>

            {preview && (
              <div className="rounded-md border p-4 text-sm">
                <p className="mb-2 font-medium">계산된 일일 목표</p>
                <p>칼로리: {preview.calories} kcal</p>
                <p>단백질: {preview.protein} g</p>
                <p>탄수화물: {preview.carbs} g</p>
                <p>지방: {preview.fat} g</p>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving || !preview}>
              {saving ? "저장 중..." : "목표 저장"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {activeGoal && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              현재 목표
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            목표 체중 {activeGoal.targetWeightKg}kg · {activeGoal.targetCalories}kcal /{" "}
            {activeGoal.targetProtein}g 단백질
          </CardContent>
        </Card>
      )}
    </div>
  );
}
