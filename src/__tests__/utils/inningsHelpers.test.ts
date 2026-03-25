import { describe, expect, it } from "vitest";
import {
  getInningsCompletionStatus,
  hasSecondInningsWon,
} from "@/utils/inningsHelpers";

describe("getInningsCompletionStatus", () => {
  it("returns isAllOut true when wickets equal teamPlayers", () => {
    const result = getInningsCompletionStatus(11, 11, 10, "3.2");
    expect(result.isAllOut).toBe(true);
  });

  it("returns isAllOut false when wickets are less than teamPlayers", () => {
    const result = getInningsCompletionStatus(11, 5, 10, "3.2");
    expect(result.isAllOut).toBe(false);
  });

  it("returns isOversCompleted true when overs equal completedOvers", () => {
    // "10.0" → formatOversCompleted("10.0") = "10.0", split → 10
    const result = getInningsCompletionStatus(11, 2, 10, "10.0");
    expect(result.isOversCompleted).toBe(true);
  });

  it("returns isOversCompleted true when ball 6 rolls over to next full over", () => {
    // "9.6" → formatOversCompleted("9.6") = "10.0", split → 10
    const result = getInningsCompletionStatus(11, 2, 10, "9.6");
    expect(result.isOversCompleted).toBe(true);
  });

  it("returns isOversCompleted false when overs are not yet completed", () => {
    const result = getInningsCompletionStatus(11, 2, 10, "8.5");
    expect(result.isOversCompleted).toBe(false);
  });

  it("returns both false in normal play", () => {
    const result = getInningsCompletionStatus(11, 3, 20, "5.3");
    expect(result.isAllOut).toBe(false);
    expect(result.isOversCompleted).toBe(false);
  });

  it("returns both true when all out on last ball", () => {
    const result = getInningsCompletionStatus(11, 11, 5, "5.0");
    expect(result.isAllOut).toBe(true);
    expect(result.isOversCompleted).toBe(true);
  });
});

describe("hasSecondInningsWon", () => {
  it("returns true when current runs exceed first innings score", () => {
    expect(hasSecondInningsWon(100, 101)).toBe(true);
  });

  it("returns false when current runs equal first innings score (not yet won)", () => {
    expect(hasSecondInningsWon(100, 100)).toBe(false);
  });

  it("returns false when current runs are less than first innings score", () => {
    expect(hasSecondInningsWon(100, 85)).toBe(false);
  });

  it("returns false when firstInningsScore is undefined", () => {
    expect(hasSecondInningsWon(undefined, 50)).toBe(false);
  });

  it("returns true by 1 run (boundary check)", () => {
    expect(hasSecondInningsWon(50, 51)).toBe(true);
  });

  it("handles zero scores", () => {
    expect(hasSecondInningsWon(0, 1)).toBe(true);
    expect(hasSecondInningsWon(0, 0)).toBe(false);
  });
});
