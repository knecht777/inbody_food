import { describe, expect, it } from "vitest";
import { bmiCategory, bodyFatPercentCategory } from "@/lib/health/standards";

describe("bmiCategory", () => {
  it("classifies underweight, normal, overweight, and obese", () => {
    expect(bmiCategory(17).label).toBe("저체중");
    expect(bmiCategory(21).label).toBe("정상");
    expect(bmiCategory(24).label).toBe("과체중");
    expect(bmiCategory(28).label).toBe("비만");
  });

  it("matches the boundary values used in the app's own test screenshot", () => {
    expect(bmiCategory(25.5).label).toBe("비만");
  });
});

describe("bodyFatPercentCategory", () => {
  it("uses different cutoffs for male and female", () => {
    expect(bodyFatPercentCategory(16.9, "male").label).toBe("표준");
    expect(bodyFatPercentCategory(16.9, "female").label).toBe("낮음");
  });

  it("classifies across the full male range", () => {
    expect(bodyFatPercentCategory(5, "male").label).toBe("낮음");
    expect(bodyFatPercentCategory(15, "male").label).toBe("표준");
    expect(bodyFatPercentCategory(22, "male").label).toBe("다소 높음");
    expect(bodyFatPercentCategory(30, "male").label).toBe("높음");
  });
});
