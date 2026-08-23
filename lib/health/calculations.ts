import type { Nutrition } from "@/types/Nutrition";
import type { Profile } from "@/types/User";

const ACTIVITY_MULTIPLIERS: Record<Profile["activityLevel"], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Mifflin-St Jeor equation. */
export function calculateBMR(profile: Profile, weightKg: number): number {
  const age = new Date().getFullYear() - profile.birthYear;
  const base = 10 * weightKg + 6.25 * profile.heightCm - 5 * age;
  return profile.sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(profile: Profile, weightKg: number): number {
  return calculateBMR(profile, weightKg) * ACTIVITY_MULTIPLIERS[profile.activityLevel];
}

const WEEKLY_RATE_KG = 0.45;
const KCAL_PER_KG = 7700;
const DAILY_ADJUSTMENT = Math.round((WEEKLY_RATE_KG * KCAL_PER_KG) / 7);

/**
 * Target macros from current weight, goal weight, and TDEE.
 * Protein is set relative to bodyweight (holds muscle during a deficit,
 * supports growth during a surplus); fat is a fixed share of calories;
 * carbs take the remainder.
 */
export function calculateTargets(
  profile: Profile,
  currentWeightKg: number,
  targetWeightKg: number,
): Nutrition {
  const tdee = calculateTDEE(profile, currentWeightKg);

  let targetCalories = tdee;
  if (targetWeightKg < currentWeightKg) targetCalories = tdee - DAILY_ADJUSTMENT;
  else if (targetWeightKg > currentWeightKg) targetCalories = tdee + DAILY_ADJUSTMENT;

  const proteinGramsPerKg = targetWeightKg < currentWeightKg ? 2.2 : 1.8;
  const targetProtein = proteinGramsPerKg * currentWeightKg;
  const targetFat = (targetCalories * 0.25) / 9;
  const targetCarbs = Math.max(0, (targetCalories - targetProtein * 4 - targetFat * 9) / 4);

  return {
    calories: Math.round(targetCalories),
    protein: Math.round(targetProtein),
    carbs: Math.round(targetCarbs),
    fat: Math.round(targetFat),
  };
}
