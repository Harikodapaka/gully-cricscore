import { describe, expect, it } from "vitest";
import { calculateOversCompleted } from "@/app/utils/calculateOversCompleted";

describe("calculateOversCompleted", () => {
  it("returns overNumber.ballNumber for a normal delivery", () => {
    expect(
      calculateOversCompleted({ overNumber: 1, ballNumber: 3, isExtra: false }),
    ).toBe("1.3");
  });

  it("returns overNumber.(ballNumber - 1) for an extra", () => {
    expect(
      calculateOversCompleted({ overNumber: 2, ballNumber: 4, isExtra: true }),
    ).toBe("2.3");
  });

  it("handles first ball of first over", () => {
    expect(
      calculateOversCompleted({ overNumber: 0, ballNumber: 1, isExtra: false }),
    ).toBe("0.1");
  });

  it("handles sixth ball of an over (end of over)", () => {
    expect(
      calculateOversCompleted({ overNumber: 3, ballNumber: 6, isExtra: false }),
    ).toBe("3.6");
  });

  it("handles extra on the sixth ball (ball count not incremented)", () => {
    expect(
      calculateOversCompleted({ overNumber: 3, ballNumber: 6, isExtra: true }),
    ).toBe("3.5");
  });

  it("handles extra on ball 1 returning 0 balls completed in the over", () => {
    expect(
      calculateOversCompleted({ overNumber: 0, ballNumber: 1, isExtra: true }),
    ).toBe("0.0");
  });

  it("handles large over numbers", () => {
    expect(
      calculateOversCompleted({
        overNumber: 19,
        ballNumber: 6,
        isExtra: false,
      }),
    ).toBe("19.6");
  });
});
