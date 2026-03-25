import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Chainable query helper
const makeQuery = (resolved: unknown) => ({
  populate: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(resolved),
  exec: vi.fn().mockResolvedValue(resolved),
});

const mockMatchFind = vi.fn();
const mockMatchCreate = vi.fn();
const mockMatchFindById = vi.fn();

vi.mock("@/models/Match", () => ({
  default: {
    find: (...args: unknown[]) => mockMatchFind(...args),
    create: (...args: unknown[]) => mockMatchCreate(...args),
    findById: (...args: unknown[]) => mockMatchFindById(...args),
  },
}));

const mockBallAggregate = vi.fn();
vi.mock("@/models/Ball", () => ({
  default: { aggregate: (...args: unknown[]) => mockBallAggregate(...args) },
}));

const mockTeamCreate = vi.fn();
vi.mock("@/models/Team", () => ({
  default: { create: (...args: unknown[]) => mockTeamCreate(...args) },
}));

const mockInningsCreate = vi.fn();
vi.mock("@/models/Innings", () => ({
  default: { create: (...args: unknown[]) => mockInningsCreate(...args) },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const INN_ID = "64f5000000000000000000a1";
const MATCH_ID = "64f5000000000000000000b1";
const TEAM_A_ID = "64f5000000000000000000c1";
const TEAM_B_ID = "64f5000000000000000000c2";

const mockInnings = {
  _id: { toString: () => INN_ID },
  inningsNumber: 1,
  score: 0,
  wickets: 0,
  status: "in-progress",
};
const mockMatch = {
  _id: { toString: () => MATCH_ID },
  location: "Mumbai",
  overs: 10,
  status: "in-progress",
  currentInnings: 1,
  teams: [TEAM_A_ID, TEAM_B_ID],
  innings: [mockInnings],
  createdAt: new Date(),
};

describe("GET /api/match", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns matches with oversCompleted for each innings", async () => {
    mockMatchFind.mockReturnValue(makeQuery([mockMatch]));
    mockBallAggregate.mockResolvedValue([
      { _id: INN_ID, overNumber: 1, ballNumber: 3, isExtra: false },
    ]);

    const { GET } = await import("@/app/api/match/route");
    const req = new NextRequest("http://localhost/api/match");
    const res = await GET(req);
    const body = await res.json();

    expect(Array.isArray(body)).toBe(true);
    expect(body[0].innings[0].oversCompleted).toBe("1.3");
  });

  it("applies limit query param", async () => {
    mockMatchFind.mockReturnValue(makeQuery([]));
    mockBallAggregate.mockResolvedValue([]);

    const { GET } = await import("@/app/api/match/route");
    const req = new NextRequest("http://localhost/api/match?limit=5");
    await GET(req);

    const chain = mockMatchFind.mock.results[0].value;
    expect(chain.limit).toHaveBeenCalledWith(5);
  });

  it("uses limit 0 (no limit) when param is missing", async () => {
    mockMatchFind.mockReturnValue(makeQuery([]));
    mockBallAggregate.mockResolvedValue([]);

    const { GET } = await import("@/app/api/match/route");
    const req = new NextRequest("http://localhost/api/match");
    await GET(req);

    const chain = mockMatchFind.mock.results[0].value;
    expect(chain.limit).toHaveBeenCalledWith(0);
  });

  it("sets oversCompleted to 0.0 when no balls exist for an innings", async () => {
    mockMatchFind.mockReturnValue(makeQuery([mockMatch]));
    mockBallAggregate.mockResolvedValue([]); // no balls

    const { GET } = await import("@/app/api/match/route");
    const res = await GET(new NextRequest("http://localhost/api/match"));
    const body = await res.json();

    expect(body[0].innings[0].oversCompleted).toBe("0.0");
  });

  it("rounds up oversCompleted when last ball is ball 6", async () => {
    mockMatchFind.mockReturnValue(makeQuery([mockMatch]));
    mockBallAggregate.mockResolvedValue([
      { _id: INN_ID, overNumber: 2, ballNumber: 6, isExtra: false },
    ]);

    const { GET } = await import("@/app/api/match/route");
    const res = await GET(new NextRequest("http://localhost/api/match"));
    const body = await res.json();

    // calculateOversCompleted gives "2.6", then ceil("2.6") → "3"
    expect(body[0].innings[0].oversCompleted).toBe("3");
  });

  it("returns 500 when DB throws", async () => {
    mockMatchFind.mockImplementation(() => {
      throw new Error("DB down");
    });

    const { GET } = await import("@/app/api/match/route");
    const res = await GET(new NextRequest("http://localhost/api/match"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch matches");
  });
});

describe("POST /api/match", () => {
  beforeEach(() => vi.clearAllMocks());

  const validBody = {
    location: "Mumbai",
    teamAName: "Tigers",
    teamBName: "Lions",
    noOfPlayers: 11,
    totalOvers: 10,
    tossWonBy: "teamA",
  };

  const mockTeamA = { _id: TEAM_A_ID };
  const mockTeamB = { _id: TEAM_B_ID };
  const mockMatchDoc = {
    _id: MATCH_ID,
    innings: [],
    save: vi.fn().mockResolvedValue(undefined),
  };
  const mockInningsDoc = { _id: INN_ID };

  it("returns 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/match/route");
    const req = new NextRequest("http://localhost/api/match", {
      method: "POST",
      body: JSON.stringify({ location: "Mumbai" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("creates match, teams, and innings and returns 201 on success", async () => {
    mockTeamCreate
      .mockResolvedValueOnce(mockTeamA)
      .mockResolvedValueOnce(mockTeamB);
    mockMatchCreate.mockResolvedValue(mockMatchDoc);
    mockInningsCreate.mockResolvedValue(mockInningsDoc);

    const populatedMatch = { _id: MATCH_ID, teams: [], innings: [] };
    const mockFindChain = {
      populate: vi.fn().mockReturnThis(),
      // Second populate call returns the populated match
    };
    // Last call to populate resolves to populated match
    let populateCallCount = 0;
    mockFindChain.populate.mockImplementation(() => {
      populateCallCount++;
      if (populateCallCount >= 2) {
        return Promise.resolve(populatedMatch);
      }
      return mockFindChain;
    });
    mockMatchFindById.mockReturnValue(mockFindChain);

    const { POST } = await import("@/app/api/match/route");
    const req = new NextRequest("http://localhost/api/match", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("assigns battingOrder 1st to teamA when tossWonBy is teamA", async () => {
    mockTeamCreate.mockResolvedValue({ _id: TEAM_A_ID });
    mockMatchCreate.mockResolvedValue(mockMatchDoc);
    mockInningsCreate.mockResolvedValue(mockInningsDoc);
    mockMatchFindById.mockReturnValue({ populate: vi.fn().mockReturnThis() });

    const { POST } = await import("@/app/api/match/route");
    await POST(
      new NextRequest("http://localhost/api/match", {
        method: "POST",
        body: JSON.stringify({ ...validBody, tossWonBy: "teamA" }),
      }),
    );

    expect(mockTeamCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ battingOrder: "1st" }),
    );
    expect(mockTeamCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ battingOrder: "2nd" }),
    );
  });

  it("assigns battingOrder 1st to teamB when tossWonBy is teamB", async () => {
    mockTeamCreate.mockResolvedValue({ _id: TEAM_B_ID });
    mockMatchCreate.mockResolvedValue(mockMatchDoc);
    mockInningsCreate.mockResolvedValue(mockInningsDoc);
    mockMatchFindById.mockReturnValue({ populate: vi.fn().mockReturnThis() });

    const { POST } = await import("@/app/api/match/route");
    await POST(
      new NextRequest("http://localhost/api/match", {
        method: "POST",
        body: JSON.stringify({ ...validBody, tossWonBy: "teamB" }),
      }),
    );

    expect(mockTeamCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ battingOrder: "2nd" }),
    );
    expect(mockTeamCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ battingOrder: "1st" }),
    );
  });

  it("returns 500 when team creation fails", async () => {
    mockTeamCreate.mockRejectedValue(new Error("DB error"));

    const { POST } = await import("@/app/api/match/route");
    const req = new NextRequest("http://localhost/api/match", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
