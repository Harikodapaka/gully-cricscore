import { describe, expect, it } from "vitest";
import { calculateBallsRemaining } from "@/app/utils/calculateBallsRemaining";

describe("calculateBallsRemaining", () => {
  it("returns total balls at the start of the match (0 overs completed)", () => {
    expect(calculateBallsRemaining(10, "0.0")).toBe(60);
  });

  it("returns correct remaining after partial over", () => {
    // 10 overs total = 60 balls; 1 over + 3 balls played = 9 balls played
    expect(calculateBallsRemaining(10, "1.3")).toBe(51);
  });

  it("returns correct remaining after full over", () => {
    // 10 overs; 3 overs completed = 18 balls played → 42 remaining
    expect(calculateBallsRemaining(10, "3.0")).toBe(42);
  });

  it("returns 0 when all overs are completed", () => {
    expect(calculateBallsRemaining(5, "5.0")).toBe(0);
  });

  it("handles 20 over match", () => {
    // 20 overs = 120 balls; 10.4 = 64 balls played → 56 remaining
    expect(calculateBallsRemaining(20, "10.4")).toBe(56);
  });

  it("handles 1 over match completed", () => {
    expect(calculateBallsRemaining(1, "1.0")).toBe(0);
  });

  it("handles last ball of match (5th ball of final over)", () => {
    // 5 overs = 30 balls; 4.5 = 29 balls played → 1 remaining
    expect(calculateBallsRemaining(5, "4.5")).toBe(1);
  });

  it("handles oversCompleted with no ball component gracefully", () => {
    // "3" parses as over=3, ball=NaN → treated as 0
    expect(calculateBallsRemaining(5, "3")).toBe(12);
  });
});
