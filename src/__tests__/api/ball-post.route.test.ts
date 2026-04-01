import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), debug: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockTrigger = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/pusher-server", () => ({
  pusherServer: { trigger: (...args: unknown[]) => mockTrigger(...args) },
}));

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const mockDbSession = {
  startTransaction: vi.fn(),
  commitTransaction: vi.fn().mockResolvedValue(undefined),
  abortTransaction: vi.fn().mockResolvedValue(undefined),
  endSession: vi.fn(),
};
vi.mock("mongoose", () => ({
  default: { startSession: vi.fn().mockResolvedValue(mockDbSession) },
}));

const mockBallCreate = vi.fn();
vi.mock("@/models/Ball", () => ({
  default: { create: (...args: unknown[]) => mockBallCreate(...args) },
}));

const mockInningsFindById = vi.fn();
vi.mock("@/models/Innings", () => ({
  default: { findById: (...args: unknown[]) => mockInningsFindById(...args) },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const INNINGS_ID = "64f5000000000000000000a1";
const MATCH_ID = "64f5000000000000000000b1";

const umpireSession = { user: { role: "umpire" } };
const spectatorSession = { user: { role: "spectator" } };

const validBody = {
  inningsId: INNINGS_ID,
  matchId: MATCH_ID,
  overNumber: 1,
  ballNumber: 3,
  runs: 4,
  isWicket: false,
  isExtra: false,
  extraType: "none",
};

const makePost = (body: object) =>
  new NextRequest("http://localhost/api/ball", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

describe("POST /api/ball", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 403 when no session exists", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { POST } = await import("@/app/api/ball/route");
    const res = await POST(makePost(validBody));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe("Forbidden");
  });

  it("returns 403 when user is a spectator", async () => {
    mockGetServerSession.mockResolvedValue(spectatorSession);

    const { POST } = await import("@/app/api/ball/route");
    const res = await POST(makePost(validBody));
    expect(res.status).toBe(403);
  });

  it("returns 400 when inningsId is missing", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);

    const { POST } = await import("@/app/api/ball/route");
    const res = await POST(makePost({ ...validBody, inningsId: undefined }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("required");
  });

  it("returns 400 when matchId is missing", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);

    const { POST } = await import("@/app/api/ball/route");
    const res = await POST(makePost({ ...validBody, matchId: undefined }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when overNumber is not a finite number", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);

    const { POST } = await import("@/app/api/ball/route");
    const res = await POST(makePost({ ...validBody, overNumber: "one" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when ballNumber is not a finite number", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);

    const { POST } = await import("@/app/api/ball/route");
    const res = await POST(makePost({ ...validBody, ballNumber: null }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when innings is not found", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);
    mockInningsFindById.mockResolvedValue(null);

    const { POST } = await import("@/app/api/ball/route");
    const res = await POST(makePost(validBody));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe("Innings not found");
  });

  it("creates ball and updates innings score on success", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);
    const mockInnings = {
      score: 10,
      wickets: 2,
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockInningsFindById.mockResolvedValue(mockInnings);
    const mockBall = { _id: "64f5000000000000000000d1", ...validBody };
    mockBallCreate.mockResolvedValue([mockBall]);

    const { POST } = await import("@/app/api/ball/route");
    const res = await POST(makePost(validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toBe("Ball created successfully");
    expect(body.ball).toBeDefined();

    // Score updated
    expect(mockInnings.score).toBe(14); // 10 + 4
    expect(mockInnings.save).toHaveBeenCalled();
  });

  it("increments wicket count when isWicket is true", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);
    const mockInnings = {
      score: 30,
      wickets: 2,
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockInningsFindById.mockResolvedValue(mockInnings);
    mockBallCreate.mockResolvedValue([
      { _id: "abc", ...validBody, isWicket: true },
    ]);

    const { POST } = await import("@/app/api/ball/route");
    await POST(makePost({ ...validBody, isWicket: true, runs: 0 }));

    expect(mockInnings.wickets).toBe(3); // 2 + 1
  });

  it("triggers pusher after successful ball creation", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);
    const mockInnings = {
      score: 0,
      wickets: 0,
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockInningsFindById.mockResolvedValue(mockInnings);
    const mockBall = { _id: "d1", inningsId: INNINGS_ID };
    mockBallCreate.mockResolvedValue([mockBall]);

    const { POST } = await import("@/app/api/ball/route");
    await POST(makePost(validBody));

    // Pusher is fire-and-forget — flush microtask queue
    await new Promise((r) => setTimeout(r, 0));

    expect(mockTrigger).toHaveBeenCalledWith(
      `match-${MATCH_ID}`,
      "score-update",
      mockBall,
    );
  });

  it("aborts transaction and returns 500 when Ball.create throws", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);
    const mockInnings = { score: 0, wickets: 0, save: vi.fn() };
    mockInningsFindById.mockResolvedValue(mockInnings);
    mockBallCreate.mockRejectedValue(new Error("DB write error"));

    const { POST } = await import("@/app/api/ball/route");
    const res = await POST(makePost(validBody));
    expect(res.status).toBe(500);
    expect(mockDbSession.abortTransaction).toHaveBeenCalled();
  });
});
