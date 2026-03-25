import { describe, expect, it } from "vitest";
import { calculateNextBall } from "@/app/utils/calculateNextBall";

describe("calculateNextBall", () => {
  it("returns over 0, ball 1 when lastBall is null (first ball ever)", () => {
    expect(calculateNextBall(null)).toEqual({ overNumber: 0, ballNumber: 1 });
  });

  it("increments ball number for a normal delivery", () => {
    expect(
      calculateNextBall({ overNumber: 0, ballNumber: 3, isExtra: false }),
    ).toEqual({
      overNumber: 0,
      ballNumber: 4,
    });
  });

  it("rolls over to next over after ball 6", () => {
    expect(
      calculateNextBall({ overNumber: 0, ballNumber: 6, isExtra: false }),
    ).toEqual({
      overNumber: 1,
      ballNumber: 1,
    });
  });

  it("does NOT increment ball number after an extra", () => {
    expect(
      calculateNextBall({ overNumber: 1, ballNumber: 3, isExtra: true }),
    ).toEqual({
      overNumber: 1,
      ballNumber: 3,
    });
  });

  it("does NOT roll over after an extra on ball 6", () => {
    // extra on ball 6 should still stay at over 1, ball 6 (not yet a legal delivery)
    expect(
      calculateNextBall({ overNumber: 1, ballNumber: 6, isExtra: true }),
    ).toEqual({
      overNumber: 1,
      ballNumber: 6,
    });
  });

  it("handles transition between overs correctly", () => {
    expect(
      calculateNextBall({ overNumber: 4, ballNumber: 6, isExtra: false }),
    ).toEqual({
      overNumber: 5,
      ballNumber: 1,
    });
  });

  it("handles first ball of a new over", () => {
    expect(
      calculateNextBall({ overNumber: 2, ballNumber: 0, isExtra: false }),
    ).toEqual({
      overNumber: 2,
      ballNumber: 1,
    });
  });

  it("handles mid-over ball increment", () => {
    expect(
      calculateNextBall({ overNumber: 5, ballNumber: 2, isExtra: false }),
    ).toEqual({
      overNumber: 5,
      ballNumber: 3,
    });
  });
});
