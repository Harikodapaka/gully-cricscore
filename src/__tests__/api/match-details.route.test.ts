import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

const makeMatchQuery = (resolved: unknown) => ({
  populate: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(resolved),
});

const mockMatchFindById = vi.fn();
vi.mock("@/models/Match", () => ({
  default: { findById: (...args: unknown[]) => mockMatchFindById(...args) },
}));

const mockBallFind = vi.fn();
vi.mock("@/models/Ball", () => ({
  default: { find: (...args: unknown[]) => mockBallFind(...args) },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_MATCH_ID = "64f5000000000000000000b1";
const INN_ID = "64f5000000000000000000a1";
const TEAM_A_ID = "64f5000000000000000000c1";
const TEAM_B_ID = "64f5000000000000000000c2";

const mockMatchDoc = {
  _id: VALID_MATCH_ID,
  location: "Delhi",
  overs: 20,
  status: "in-progress",
  currentInnings: 1,
  createdAt: new Date().toISOString(),
  completedAt: undefined,
  wonBy: undefined,
  winnerMessage: undefined,
  teams: [
    {
      _id: TEAM_A_ID,
      name: "Eagles",
      numberOfPlayers: 11,
      battingOrder: "1st",
    },
    { _id: TEAM_B_ID, name: "Hawks", numberOfPlayers: 11, battingOrder: "2nd" },
  ],
  innings: [
    {
      _id: INN_ID,
      inningsNumber: 1,
      battingTeamId: TEAM_A_ID,
      bowlingTeamId: TEAM_B_ID,
      score: 45,
      wickets: 2,
      status: "in-progress",
      startedAt: new Date().toISOString(),
      completedAt: undefined,
    },
  ],
};

const mockBalls = [
  {
    _id: "64f5000000000000000000d1",
    inningsId: INN_ID,
    overNumber: 3,
    ballNumber: 2,
    runs: 4,
    isWicket: false,
    isExtra: false,
    extraType: "none",
    timestamp: new Date().toISOString(),
  },
];

// Utility to build context params
const makeContext = (matchId: string) => ({
  params: Promise.resolve({ matchId }),
});

describe("GET /api/match/[matchId]/details", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 400 for an invalid ObjectId", async () => {
    const { GET } = await import("@/app/api/match/[matchId]/details/route");
    const res = await GET(
      new NextRequest("http://localhost/api/match/bad-id/details"),
      makeContext("bad-id"),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/Invalid match ID/i);
  });

  it("returns 404 when match does not exist", async () => {
    mockMatchFindById.mockReturnValue(makeMatchQuery(null));
    mockBallFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });

    const { GET } = await import("@/app/api/match/[matchId]/details/route");
    const res = await GET(
      new NextRequest(`http://localhost/api/match/${VALID_MATCH_ID}/details`),
      makeContext(VALID_MATCH_ID),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe("Match not found");
  });

  it("returns match data with innings and balls on success", async () => {
    mockMatchFindById.mockReturnValue(makeMatchQuery(mockMatchDoc));
    mockBallFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockBalls),
    });

    const { GET } = await import("@/app/api/match/[matchId]/details/route");
    const res = await GET(
      new NextRequest(`http://localhost/api/match/${VALID_MATCH_ID}/details`),
      makeContext(VALID_MATCH_ID),
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data._id).toBe(VALID_MATCH_ID);
    expect(body.data.teams).toHaveLength(2);
    expect(body.data.innings).toHaveLength(1);
    expect(body.data.innings[0].balls).toHaveLength(1);
    expect(body.data.innings[0].oversCompleted).toBe("3.2");
  });

  it("returns oversCompleted 0.0 when no balls exist for an innings", async () => {
    mockMatchFindById.mockReturnValue(makeMatchQuery(mockMatchDoc));
    mockBallFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });

    const { GET } = await import("@/app/api/match/[matchId]/details/route");
    const res = await GET(
      new NextRequest(`http://localhost/api/match/${VALID_MATCH_ID}/details`),
      makeContext(VALID_MATCH_ID),
    );
    const body = await res.json();
    expect(body.data.innings[0].oversCompleted).toBe("0.0");
  });

  it("serialises all _id fields to strings", async () => {
    mockMatchFindById.mockReturnValue(makeMatchQuery(mockMatchDoc));
    mockBallFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockBalls),
    });

    const { GET } = await import("@/app/api/match/[matchId]/details/route");
    const res = await GET(
      new NextRequest(`http://localhost/api/match/${VALID_MATCH_ID}/details`),
      makeContext(VALID_MATCH_ID),
    );
    const body = await res.json();

    expect(typeof body.data._id).toBe("string");
    expect(typeof body.data.teams[0]._id).toBe("string");
    expect(typeof body.data.innings[0]._id).toBe("string");
    expect(typeof body.data.innings[0].balls[0]._id).toBe("string");
  });

  it("includes completedAt and wonBy in response when match is completed", async () => {
    const completedMatch = {
      ...mockMatchDoc,
      status: "completed",
      completedAt: new Date().toISOString(),
      wonBy: TEAM_A_ID,
      winnerMessage: "Eagles won by 20 runs",
    };
    mockMatchFindById.mockReturnValue(makeMatchQuery(completedMatch));
    mockBallFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });

    const { GET } = await import("@/app/api/match/[matchId]/details/route");
    const res = await GET(
      new NextRequest(`http://localhost/api/match/${VALID_MATCH_ID}/details`),
      makeContext(VALID_MATCH_ID),
    );
    const body = await res.json();

    expect(body.data.completedAt).toBeDefined();
    expect(body.data.wonBy).toBe(TEAM_A_ID);
    expect(body.data.winnerMessage).toBe("Eagles won by 20 runs");
  });

  it("returns 500 when DB throws", async () => {
    mockMatchFindById.mockImplementation(() => {
      throw new Error("DB error");
    });

    const { GET } = await import("@/app/api/match/[matchId]/details/route");
    const res = await GET(
      new NextRequest(`http://localhost/api/match/${VALID_MATCH_ID}/details`),
      makeContext(VALID_MATCH_ID),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
