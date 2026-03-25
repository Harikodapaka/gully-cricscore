import { describe, expect, it } from "vitest";
import { formatOversCompleted } from "@/app/utils/formatOversCompleted";

describe("formatOversCompleted", () => {
  it("returns the string unchanged when ball count is not 6", () => {
    expect(formatOversCompleted("2.3")).toBe("2.3");
  });

  it("increments over and resets ball to 0 when ball count is 6", () => {
    expect(formatOversCompleted("2.6")).toBe("3.0");
  });

  it("handles over 0, ball 6 → 1.0", () => {
    expect(formatOversCompleted("0.6")).toBe("1.0");
  });

  it("handles large over numbers", () => {
    expect(formatOversCompleted("19.6")).toBe("20.0");
  });

  it("returns unchanged for ball 0", () => {
    expect(formatOversCompleted("3.0")).toBe("3.0");
  });

  it("returns unchanged for ball 5", () => {
    expect(formatOversCompleted("1.5")).toBe("1.5");
  });

  it("returns unchanged for ball 1", () => {
    expect(formatOversCompleted("0.1")).toBe("0.1");
  });
});
