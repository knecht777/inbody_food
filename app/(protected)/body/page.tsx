"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BodyTrendChart } from "@/components/BodyTrendChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { uploadBodyPhoto } from "@/lib/blob/upload";
import { getProfile } from "@/lib/firebase/profile";
import { bmiCategory, bodyFatPercentCategory } from "@/lib/health/standards";
import { addBodyMeasurement, listBodyMeasurements } from "@/services/body/bodyMeasurements";
import type { BodyMeasurement } from "@/types/BodyMeasurement";
import type { Profile } from "@/types/User";

type AnalyzedValues = {
  weightKg: number | null;
  skeletalMuscleMassKg: number | null;
  bodyFatMassKg: number | null;
  bodyFatPercent: number | null;
  bmi: number | null;
};

export default function BodyPage() {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [weightKg, setWeightKg] = useState("");
  const [skeletalMuscleMassKg, setSkeletalMuscleMassKg] = useState("");
  const [bodyFatMassKg, setBodyFatMassKg] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [bmi, setBmi] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  async function refresh(uid: string) {
    const list = await listBodyMeasurements(uid, 90);
    setMeasurements(list);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([listBodyMeasurements(user.uid, 90), getProfile(user.uid)]).then(
      ([list, p]) => {
        if (cancelled) return;
        setMeasurements(list);
        setProfile(p);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [user]);

  function applyAnalyzed(values: AnalyzedValues) {
    if (values.weightKg !== null) setWeightKg(String(values.weightKg));
    if (values.skeletalMuscleMassKg !== null)
      setSkeletalMuscleMassKg(String(values.skeletalMuscleMassKg));
    if (values.bodyFatMassKg !== null) setBodyFatMassKg(String(values.bodyFatMassKg));
    if (values.bodyFatPercent !== null) setBodyFatPercent(String(values.bodyFatPercent));
    if (values.bmi !== null) setBmi(String(values.bmi));
  }

  async function handlePhotoSelected(file: File) {
    if (!user) return;
    setPhotoFile(file);
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const measurementId = crypto.randomUUID();
      const url = await uploadBodyPhoto(user, measurementId, file);
      setPhotoUrl(url);

      const idToken = await user.getIdToken();
      const response = await fetch("/api/body/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ imageUrl: url }),
      });
      if (!response.ok) throw new Error("analysis failed");
      const values = (await response.json()) as AnalyzedValues;
      applyAnalyzed(values);
    } catch {
      setAnalyzeError("사진 분석에 실패했습니다. 수치를 직접 입력해 주세요.");
    } finally {
      setAnalyzing(false);
    }
  }

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
        bodyFatMassKg: bodyFatMassKg ? Number(bodyFatMassKg) : undefined,
        bodyFatPercent: bodyFatPercent ? Number(bodyFatPercent) : undefined,
        bmi: bmi ? Number(bmi) : undefined,
        imageUrl: photoUrl ?? undefined,
        source: photoUrl ? "inbody_photo" : "manual",
      });
      setWeightKg("");
      setSkeletalMuscleMassKg("");
      setBodyFatMassKg("");
      setBodyFatPercent("");
      setBmi("");
      setPhotoFile(null);
      setPhotoUrl(null);
      await refresh(user.uid);
    } catch {
      setError("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  const latest = measurements[0];
  const bmiInfo = latest?.bmi !== undefined ? bmiCategory(latest.bmi) : null;
  const bodyFatInfo =
    latest?.bodyFatPercent !== undefined
      ? bodyFatPercentCategory(latest.bodyFatPercent, profile?.sex ?? "male")
      : null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>인바디 기록 추가</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="inbodyPhoto">인바디 결과 사진으로 자동 입력</Label>
            <Input
              id="inbodyPhoto"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoSelected(file);
              }}
            />
            {analyzing && (
              <p className="text-sm text-muted-foreground">사진에서 수치를 읽는 중...</p>
            )}
            {analyzeError && <p className="text-sm text-destructive">{analyzeError}</p>}
            {photoFile && !analyzing && !analyzeError && (
              <p className="text-sm text-muted-foreground">
                분석된 값을 아래에서 확인하고 필요하면 수정한 뒤 저장해 주세요.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t pt-4">
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
              <Label htmlFor="bfm">체지방량 (kg, 선택)</Label>
              <Input
                id="bfm"
                type="number"
                step="0.1"
                value={bodyFatMassKg}
                onChange={(e) => setBodyFatMassKg(e.target.value)}
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="bmi">BMI (선택)</Label>
              <Input
                id="bmi"
                type="number"
                step="0.1"
                value={bmi}
                onChange={(e) => setBmi(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? "저장 중..." : "기록 추가"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {(bmiInfo || bodyFatInfo) && (
        <Card>
          <CardHeader>
            <CardTitle>최근 측정 기준</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {bmiInfo && (
              <p>
                BMI {latest.bmi} — <span className="font-medium">{bmiInfo.label}</span>
              </p>
            )}
            {bodyFatInfo && (
              <p>
                체지방률 {latest.bodyFatPercent}% —{" "}
                <span className="font-medium">{bodyFatInfo.label}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              일반적인 참고 기준이며, InBody 기기 화면의 신장별 표준 범위와는 다를 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>체성분 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          ) : (
            <BodyTrendChart measurements={measurements} />
          )}
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
