import type { Profile } from "@/types/User";

/**
 * General reference ranges only - NOT InBody's proprietary height/age/sex
 * look-up-table standards shown on the device screen. Those tables are not
 * publicly published, so this uses widely-used general guidelines instead
 * (WHO Asian BMI cutoffs; commonly cited body-fat-percentage ranges).
 */

export type StandardLevel = "low" | "normal" | "high" | "veryHigh";

export function bmiCategory(bmi: number): { level: StandardLevel; label: string } {
  if (bmi < 18.5) return { level: "low", label: "저체중" };
  if (bmi < 23) return { level: "normal", label: "정상" };
  if (bmi < 25) return { level: "high", label: "과체중" };
  return { level: "veryHigh", label: "비만" };
}

export function bodyFatPercentCategory(
  percent: number,
  sex: Profile["sex"] = "male",
): { level: StandardLevel; label: string } {
  const cutoffs =
    sex === "male" ? { low: 10, normal: 20, high: 25 } : { low: 18, normal: 28, high: 33 };

  if (percent < cutoffs.low) return { level: "low", label: "낮음" };
  if (percent < cutoffs.normal) return { level: "normal", label: "표준" };
  if (percent < cutoffs.high) return { level: "high", label: "다소 높음" };
  return { level: "veryHigh", label: "높음" };
}
