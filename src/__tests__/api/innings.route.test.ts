import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

const makeInningsQuery = (resolved: unknown) => ({
  populate: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue(resolved),
});

const makeBallQuery = (resolved: unknown) => ({
  sort: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue(resolved),
});

const mockInningsFindById = vi.fn();
// Match and Team are imported for type inference but not called in this route
vi.mock("@/models/Match", () => ({ default: {} }));
vi.mock("@/models/Team", () => ({ default: {} }));
vi.mock("@/models/Innings", () => ({
  default: { findById: (...args: unknown[]) => mockInningsFindById(...args) },
}));

const mockBallFindOne = vi.fn();
vi.mock("@/models/Ball", () => ({
  default: { findOne: (...args: unknown[]) => mockBallFindOne(...args) },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_INNINGS_ID = "64f5000000000000000000a1";
const TEAM_A_ID = "64f5000000000000000000c1";
const TEAM_B_ID = "64f5000000000000000000c2";

const mockInningsDoc = {
  _id: VALID_INNINGS_ID,
  inningsNumber: 1,
  battingTeamId: { _id: TEAM_A_ID, name: "Eagles" },
  bowlingTeamId: { _id: TEAM_B_ID, name: "Hawks" },
  score: 80,
  wickets: 4,
  status: "in-progress",
  startedAt: new Date().toISOString(),
};

const makeContext = (inningsId: string) => ({
  params: Promise.resolve({ inningsId }),
});

describe("GET /api/innings/[inningsId]", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 400 for an invalid innings ID", async () => {
    const { GET } = await import("@/app/api/innings/[inningsId]/route");
    const res = await GET(
      new NextRequest("http://localhost/api/innings/bad-id"),
      makeContext("bad-id"),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/Invalid innings ID/i);
  });

  it("returns 404 when innings is not found", async () => {
    mockInningsFindById.mockReturnValue(makeInningsQuery(null));
    mockBallFindOne.mockReturnValue(makeBallQuery(null));

    const { GET } = await import("@/app/api/innings/[inningsId]/route");
    const res = await GET(
      new NextRequest(`http://localhost/api/innings/${VALID_INNINGS_ID}`),
      makeContext(VALID_INNINGS_ID),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe("Innings not found");
  });

  it("returns innings data with oversCompleted on success", async () => {
    mockInningsFindById.mockReturnValue(makeInningsQuery(mockInningsDoc));
    mockBallFindOne.mockReturnValue(
      makeBallQuery({ overNumber: 5, ballNumber: 4, isExtra: false }),
    );

    const { GET } = await import("@/app/api/innings/[inningsId]/route");
    const res = await GET(
      new NextRequest(`http://localhost/api/innings/${VALID_INNINGS_ID}`),
      makeContext(VALID_INNINGS_ID),
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.score).toBe(80);
    expect(body.wickets).toBe(4);
    expect(body.oversCompleted).toBe("5.4");
  });

  it("returns oversCompleted as 0.0 when no balls exist", async () => {
    mockInningsFindById.mockReturnValue(makeInningsQuery(mockInningsDoc));
    mockBallFindOne.mockReturnValue(makeBallQuery(null));

    const { GET } = await import("@/app/api/innings/[inningsId]/route");
    const res = await GET(
      new NextRequest(`http://localhost/api/innings/${VALID_INNINGS_ID}`),
      makeContext(VALID_INNINGS_ID),
    );
    const body = await res.json();
    expect(body.oversCompleted).toBe("0.0");
  });

  it("computes oversCompleted correctly for an extra ball", async () => {
    mockInningsFindById.mockReturnValue(makeInningsQuery(mockInningsDoc));
    // extra on ball 4 → oversCompleted = "2.3"
    mockBallFindOne.mockReturnValue(
      makeBallQuery({ overNumber: 2, ballNumber: 4, isExtra: true }),
    );

    const { GET } = await import("@/app/api/innings/[inningsId]/route");
    const res = await GET(
      new NextRequest(`http://localhost/api/innings/${VALID_INNINGS_ID}`),
      makeContext(VALID_INNINGS_ID),
    );
    const body = await res.json();
    expect(body.oversCompleted).toBe("2.3");
  });

  it("returns 500 when DB throws", async () => {
    mockInningsFindById.mockImplementation(() => {
      throw new Error("DB error");
    });

    const { GET } = await import("@/app/api/innings/[inningsId]/route");
    const res = await GET(
      new NextRequest(`http://localhost/api/innings/${VALID_INNINGS_ID}`),
      makeContext(VALID_INNINGS_ID),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.message).toBe("Failed to fetch innings data");
  });
});
