import { describe, expect, it } from "vitest";
import { calculateBMR, calculateTargets, calculateTDEE } from "@/lib/health/calculations";
import type { Profile } from "@/types/User";

const currentYear = new Date().getFullYear();

const maleProfile: Profile = {
  userId: "u1",
  sex: "male",
  birthYear: currentYear - 36,
  heightCm: 175,
  activityLevel: "moderate",
  updatedAt: new Date().toISOString(),
};

const femaleProfile: Profile = {
  ...maleProfile,
  sex: "female",
};

describe("calculateBMR", () => {
  it("matches the Mifflin-St Jeor equation for a male", () => {
    // 10*80 + 6.25*175 - 5*36 + 5 = 1718.75
    expect(calculateBMR(maleProfile, 80)).toBeCloseTo(1718.75, 2);
  });

  it("is 166 kcal lower for a female at the same stats", () => {
    expect(calculateBMR(femaleProfile, 80)).toBeCloseTo(calculateBMR(maleProfile, 80) - 166, 2);
  });
});

describe("calculateTDEE", () => {
  it("scales BMR by the activity multiplier", () => {
    const bmr = calculateBMR(maleProfile, 80);
    expect(calculateTDEE(maleProfile, 80)).toBeCloseTo(bmr * 1.55, 2);
  });
});

describe("calculateTargets", () => {
  it("applies a calorie deficit when the goal is to lose weight", () => {
    const targets = calculateTargets(maleProfile, 80, 75);
    const tdee = calculateTDEE(maleProfile, 80);
    expect(targets.calories).toBeLessThan(tdee);
    expect(targets.protein).toBe(Math.round(2.2 * 80));
  });

  it("applies a calorie surplus when the goal is to gain weight", () => {
    const targets = calculateTargets(maleProfile, 70, 75);
    const tdee = calculateTDEE(maleProfile, 70);
    expect(targets.calories).toBeGreaterThan(tdee);
    expect(targets.protein).toBe(Math.round(1.8 * 70));
  });

  it("holds calories at maintenance when the goal equals current weight", () => {
    const targets = calculateTargets(maleProfile, 75, 75);
    const tdee = calculateTDEE(maleProfile, 75);
    expect(targets.calories).toBe(Math.round(tdee));
  });

  it("macros reconcile back to the total calorie target", () => {
    const targets = calculateTargets(maleProfile, 80, 75);
    const recomputedCalories = targets.protein * 4 + targets.carbs * 4 + targets.fat * 9;
    expect(recomputedCalories).toBeCloseTo(targets.calories, -1);
  });

  it("never returns negative carbs", () => {
    const targets = calculateTargets(maleProfile, 200, 60);
    expect(targets.carbs).toBeGreaterThanOrEqual(0);
  });
});
