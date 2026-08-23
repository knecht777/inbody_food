"use client";

import { UserCircle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
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
import { getProfile, upsertProfile } from "@/lib/firebase/profile";
import type { Profile } from "@/types/User";

const ACTIVITY_LABELS: Record<Profile["activityLevel"], string> = {
  sedentary: "거의 운동 안 함",
  light: "가벼운 운동 (주 1~3회)",
  moderate: "보통 운동 (주 3~5회)",
  active: "활발한 운동 (주 6~7회)",
  very_active: "매우 활발함 (매일 강도 높은 운동)",
};

const SEX_LABELS: Record<Profile["sex"], string> = {
  male: "남성",
  female: "여성",
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sex, setSex] = useState<Profile["sex"]>("male");
  const [birthYear, setBirthYear] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [activityLevel, setActivityLevel] = useState<Profile["activityLevel"]>("moderate");

  useEffect(() => {
    if (!user) return;
    getProfile(user.uid).then((profile) => {
      if (profile) {
        setSex(profile.sex);
        setBirthYear(String(profile.birthYear));
        setHeightCm(String(profile.heightCm));
        setActivityLevel(profile.activityLevel);
      }
      setLoading(false);
    });
  }, [user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    await upsertProfile(user.uid, {
      sex,
      birthYear: Number(birthYear),
      heightCm: Number(heightCm),
      activityLevel,
    });
    setSaving(false);
    setSaved(true);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="size-4 text-primary" />
          프로필
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>성별</Label>
            <Select value={sex} onValueChange={(v) => setSex(v as Profile["sex"])}>
              <SelectTrigger>
                <SelectValue>{(v: Profile["sex"]) => SEX_LABELS[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">남성</SelectItem>
                <SelectItem value="female">여성</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="birthYear">출생연도</Label>
            <Input
              id="birthYear"
              type="number"
              required
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="heightCm">키 (cm)</Label>
            <Input
              id="heightCm"
              type="number"
              step="0.1"
              required
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>활동량</Label>
            <Select
              value={activityLevel}
              onValueChange={(v) => setActivityLevel(v as Profile["activityLevel"])}
            >
              <SelectTrigger>
                <SelectValue>
                  {(v: Profile["activityLevel"]) => ACTIVITY_LABELS[v]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {saved && <p className="text-sm text-green-600">저장되었습니다.</p>}
          <Button type="submit" disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
