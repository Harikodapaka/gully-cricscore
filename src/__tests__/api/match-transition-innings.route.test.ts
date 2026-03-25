import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const mockMatchFindById = vi.fn();
const mockMatchFindByIdAndUpdate = vi.fn();
vi.mock("@/models/Match", () => ({
  default: {
    findById: (...args: unknown[]) => mockMatchFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) =>
      mockMatchFindByIdAndUpdate(...args),
  },
}));

const mockInningsFindByIdAndUpdate = vi.fn();
const mockInningsCreate = vi.fn();
const mockInningsFind = vi.fn();
vi.mock("@/models/Innings", () => ({
  default: {
    findByIdAndUpdate: (...args: unknown[]) =>
      mockInningsFindByIdAndUpdate(...args),
    create: (...args: unknown[]) => mockInningsCreate(...args),
    find: (...args: unknown[]) => mockInningsFind(...args),
  },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_ID = "64f5000000000000000000b1";
const INN_ID_1 = "64f5000000000000000000a1";
const INN_ID_2 = "64f5000000000000000000a2";
const TEAM_A_ID = "64f5000000000000000000c1";
const TEAM_B_ID = "64f5000000000000000000c2";

const makeFirstInningsMatch = () => ({
  status: "in-progress",
  currentInnings: 1,
  innings: [{ _id: INN_ID_1, inningsNumber: 1, status: "in-progress" }],
  teams: [
    { _id: TEAM_A_ID, name: "Eagles", battingOrder: "1st" },
    { _id: TEAM_B_ID, name: "Hawks", battingOrder: "2nd" },
  ],
  populate: vi.fn().mockReturnThis(),
  exec: vi.fn().mockReturnThis(),
});

const makeContext = (matchId: string) => ({
  params: Promise.resolve({ matchId }),
});

describe("PATCH /api/match/[matchId]/transition-innings", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 400 for an invalid matchId", async () => {
    const { PATCH } = await import(
      "@/app/api/match/[matchId]/transition-innings/route"
    );
    const res = await PATCH(
      new NextRequest("http://localhost", { method: "PATCH" }),
      makeContext("invalid-id"),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/Invalid match ID/i);
  });

  it("returns 404 when match is not found", async () => {
    const chain = {
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(null),
    };
    mockMatchFindById.mockReturnValue(chain);

    const { PATCH } = await import(
      "@/app/api/match/[matchId]/transition-innings/route"
    );
    const res = await PATCH(
      new NextRequest("http://localhost", { method: "PATCH" }),
      makeContext(VALID_ID),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when match is already completed", async () => {
    const match = { ...makeFirstInningsMatch(), status: "completed" };
    mockMatchFindById.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(match),
    });

    const { PATCH } = await import(
      "@/app/api/match/[matchId]/transition-innings/route"
    );
    const res = await PATCH(
      new NextRequest("http://localhost", { method: "PATCH" }),
      makeContext(VALID_ID),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("Match is already completed");
  });

  it("returns 404 when current innings not found in match", async () => {
    const match = {
      ...makeFirstInningsMatch(),
      innings: [],
      currentInnings: 1,
    };
    mockMatchFindById.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(match),
    });

    const { PATCH } = await import(
      "@/app/api/match/[matchId]/transition-innings/route"
    );
    const res = await PATCH(
      new NextRequest("http://localhost", { method: "PATCH" }),
      makeContext(VALID_ID),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe("Current innings not found");
  });

  it("returns 400 when current innings is already completed", async () => {
    const match = {
      ...makeFirstInningsMatch(),
      innings: [{ _id: INN_ID_1, inningsNumber: 1, status: "completed" }],
    };
    mockMatchFindById.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(match),
    });

    const { PATCH } = await import(
      "@/app/api/match/[matchId]/transition-innings/route"
    );
    const res = await PATCH(
      new NextRequest("http://localhost", { method: "PATCH" }),
      makeContext(VALID_ID),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("Current innings is already completed");
  });

  it("transitions to second innings and returns updated match (first innings complete)", async () => {
    const match = makeFirstInningsMatch();
    mockMatchFindById.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(match),
    });
    mockInningsFindByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ status: "completed" }),
    });
    mockInningsCreate.mockResolvedValue({ _id: INN_ID_2 });

    const updatedMatch = {
      currentInnings: 2,
      toObject: vi.fn().mockReturnValue({ currentInnings: 2 }),
    };
    mockMatchFindByIdAndUpdate.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(updatedMatch),
    });

    const { PATCH } = await import(
      "@/app/api/match/[matchId]/transition-innings/route"
    );
    const res = await PATCH(
      new NextRequest("http://localhost", { method: "PATCH" }),
      makeContext(VALID_ID),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Innings transition successful");
  });

  it("completes match when second innings is finished (team 2 wins by more runs)", async () => {
    const secondInningsMatch = {
      status: "in-progress",
      currentInnings: 2,
      innings: [
        { _id: INN_ID_1, inningsNumber: 1, status: "in-progress" },
        { _id: INN_ID_2, inningsNumber: 2, status: "in-progress" },
      ],
      teams: [
        { _id: TEAM_A_ID, name: "Eagles", battingOrder: "1st" },
        { _id: TEAM_B_ID, name: "Hawks", battingOrder: "2nd" },
      ],
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockReturnThis(),
    };
    mockMatchFindById.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(secondInningsMatch),
    });
    mockInningsFindByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ status: "completed" }),
    });

    // Two innings from DB for score comparison
    mockInningsFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: INN_ID_1,
          inningsNumber: 1,
          score: 100,
          battingTeamId: TEAM_A_ID,
        },
        {
          _id: INN_ID_2,
          inningsNumber: 2,
          score: 120,
          battingTeamId: TEAM_B_ID,
        },
      ]),
    });
    mockMatchFindByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue({}),
    });

    const { PATCH } = await import(
      "@/app/api/match/[matchId]/transition-innings/route"
    );
    const res = await PATCH(
      new NextRequest("http://localhost", { method: "PATCH" }),
      makeContext(VALID_ID),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Match completed successfully");

    expect(mockMatchFindByIdAndUpdate).toHaveBeenCalledWith(
      VALID_ID,
      expect.objectContaining({ status: "completed", wonBy: TEAM_B_ID }),
    );
  });

  it("sets winnerMessage correctly when first innings team wins", async () => {
    const secondInningsMatch = {
      status: "in-progress",
      currentInnings: 2,
      innings: [
        { _id: INN_ID_1, inningsNumber: 1, status: "in-progress" },
        { _id: INN_ID_2, inningsNumber: 2, status: "in-progress" },
      ],
      teams: [
        { _id: TEAM_A_ID, name: "Eagles", battingOrder: "1st" },
        { _id: TEAM_B_ID, name: "Hawks", battingOrder: "2nd" },
      ],
    };
    mockMatchFindById.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(secondInningsMatch),
    });
    mockInningsFindByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ status: "completed" }),
    });

    mockInningsFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: INN_ID_1,
          inningsNumber: 1,
          score: 150,
          battingTeamId: TEAM_A_ID,
        },
        {
          _id: INN_ID_2,
          inningsNumber: 2,
          score: 100,
          battingTeamId: TEAM_B_ID,
        },
      ]),
    });
    mockMatchFindByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue({}),
    });

    const { PATCH } = await import(
      "@/app/api/match/[matchId]/transition-innings/route"
    );
    const res = await PATCH(
      new NextRequest("http://localhost", { method: "PATCH" }),
      makeContext(VALID_ID),
    );
    expect(res.status).toBe(200);

    expect(mockMatchFindByIdAndUpdate).toHaveBeenCalledWith(
      VALID_ID,
      expect.objectContaining({
        wonBy: TEAM_A_ID,
        winnerMessage: "Eagles won by 50 runs",
      }),
    );
  });

  it("sets winnerMessage to 'Match tied' when scores are equal", async () => {
    const secondInningsMatch = {
      status: "in-progress",
      currentInnings: 2,
      innings: [
        { _id: INN_ID_1, inningsNumber: 1, status: "in-progress" },
        { _id: INN_ID_2, inningsNumber: 2, status: "in-progress" },
      ],
      teams: [
        { _id: TEAM_A_ID, name: "Eagles", battingOrder: "1st" },
        { _id: TEAM_B_ID, name: "Hawks", battingOrder: "2nd" },
      ],
    };
    mockMatchFindById.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(secondInningsMatch),
    });
    mockInningsFindByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ status: "completed" }),
    });
    mockInningsFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: INN_ID_1,
          inningsNumber: 1,
          score: 75,
          battingTeamId: TEAM_A_ID,
        },
        {
          _id: INN_ID_2,
          inningsNumber: 2,
          score: 75,
          battingTeamId: TEAM_B_ID,
        },
      ]),
    });
    mockMatchFindByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue({}),
    });

    const { PATCH } = await import(
      "@/app/api/match/[matchId]/transition-innings/route"
    );
    await PATCH(
      new NextRequest("http://localhost", { method: "PATCH" }),
      makeContext(VALID_ID),
    );

    expect(mockMatchFindByIdAndUpdate).toHaveBeenCalledWith(
      VALID_ID,
      expect.objectContaining({ winnerMessage: "Match tied" }),
    );
  });

  it("returns 500 on unexpected error", async () => {
    mockMatchFindById.mockImplementation(() => {
      throw new Error("Unexpected");
    });

    const { PATCH } = await import(
      "@/app/api/match/[matchId]/transition-innings/route"
    );
    const res = await PATCH(
      new NextRequest("http://localhost", { method: "PATCH" }),
      makeContext(VALID_ID),
    );
    expect(res.status).toBe(500);
  });
});
