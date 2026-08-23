"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { addBodyMeasurement, listBodyMeasurements } from "@/services/body/bodyMeasurements";
import type { BodyMeasurement } from "@/types/BodyMeasurement";

export default function BodyPage() {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weightKg, setWeightKg] = useState("");
  const [skeletalMuscleMassKg, setSkeletalMuscleMassKg] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh(uid: string) {
    const list = await listBodyMeasurements(uid);
    setMeasurements(list);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listBodyMeasurements(user.uid).then((list) => {
      if (!cancelled) {
        setMeasurements(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await addBodyMeasurement(user.uid, {
        measuredAt: new Date().toISOString(),
        weightKg: Number(weightKg),
        skeletalMuscleMassKg: skeletalMuscleMassKg ? Number(skeletalMuscleMassKg) : undefined,
        bodyFatPercent: bodyFatPercent ? Number(bodyFatPercent) : undefined,
        source: "manual",
      });
      setWeightKg("");
      setSkeletalMuscleMassKg("");
      setBodyFatPercent("");
      await refresh(user.uid);
    } catch {
      setError("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>인바디 기록 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="weightKg">체중 (kg)</Label>
              <Input
                id="weightKg"
                type="number"
                step="0.1"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="smm">골격근량 (kg, 선택)</Label>
              <Input
                id="smm"
                type="number"
                step="0.1"
                value={skeletalMuscleMassKg}
                onChange={(e) => setSkeletalMuscleMassKg(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bfp">체지방률 (%, 선택)</Label>
              <Input
                id="bfp"
                type="number"
                step="0.1"
                value={bodyFatPercent}
                onChange={(e) => setBodyFatPercent(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? "저장 중..." : "기록 추가"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>기록 히스토리</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          ) : measurements.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 기록이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {measurements.map((m) => (
                <li key={m.id} className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(m.measuredAt).toLocaleDateString("ko-KR")}
                  </span>
                  <span>
                    {m.weightKg}kg
                    {m.bodyFatPercent !== undefined ? ` · 체지방 ${m.bodyFatPercent}%` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
