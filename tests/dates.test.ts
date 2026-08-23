import { describe, expect, it } from "vitest";
import { dateIdFor, monthIdFor, monthRange, weekIdFor, weekRange } from "@/lib/health/dates";

describe("dateIdFor", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(dateIdFor(new Date("2026-08-23T15:30:00.000Z"))).toBe("2026-08-23");
  });
});

describe("monthIdFor / monthRange", () => {
  it("formats a date as YYYY-MM", () => {
    expect(monthIdFor(new Date("2026-08-23T00:00:00.000Z"))).toBe("2026-08");
  });

  it("returns the first and last day of the month", () => {
    expect(monthRange("2026-08")).toEqual({ start: "2026-08-01", end: "2026-08-31" });
  });

  it("handles a 28-day February correctly", () => {
    expect(monthRange("2026-02")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
  });
});

describe("weekIdFor / weekRange", () => {
  it("computes the ISO week for a known date", () => {
    // Verified against the running app: 2026-08-23 (Sunday) falls in ISO week 34.
    expect(weekIdFor(new Date("2026-08-23T00:00:00.000Z"))).toBe("2026-W34");
  });

  it("returns a Monday-to-Sunday range for that week", () => {
    expect(weekRange("2026-W34")).toEqual({ start: "2026-08-17", end: "2026-08-23" });
  });

  it("round-trips: any day in the week maps back to the same range", () => {
    const monday = weekIdFor(new Date("2026-08-17T12:00:00.000Z"));
    const sunday = weekIdFor(new Date("2026-08-23T12:00:00.000Z"));
    expect(monday).toBe(sunday);
  });
});
