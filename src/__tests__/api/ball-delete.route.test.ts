import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
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

const mockBallFindByIdAndDelete = vi.fn();
vi.mock("@/models/Ball", () => ({
  default: {
    findByIdAndDelete: (...args: unknown[]) =>
      mockBallFindByIdAndDelete(...args),
  },
}));

const mockInningsFindByIdAndUpdate = vi.fn();
vi.mock("@/models/Innings", () => ({
  default: {
    findByIdAndUpdate: (...args: unknown[]) =>
      mockInningsFindByIdAndUpdate(...args),
  },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BALL_ID = "64f5000000000000000000d1";
const INNINGS_ID = "64f5000000000000000000a1";
const MATCH_ID = "64f5000000000000000000b1";

const umpireSession = { user: { role: "umpire" } };
const spectatorSession = { user: { role: "spectator" } };

const mockDeletedBall = {
  _id: BALL_ID,
  inningsId: INNINGS_ID,
  runs: 4,
  isWicket: false,
  overNumber: 1,
  ballNumber: 3,
};

const makeContext = (ballId: string) => ({
  params: Promise.resolve({ ballId }),
});

const makeRequest = (ballId: string, matchId?: string) =>
  new NextRequest(
    `http://localhost/api/ball/${ballId}${matchId ? `?matchId=${matchId}` : ""}`,
    { method: "DELETE" },
  );

describe("DELETE /api/ball/[ballId]", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 403 when no session exists", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/ball/[ballId]/route");
    const res = await DELETE(makeRequest(BALL_ID), makeContext(BALL_ID));
    expect(res.status).toBe(403);
  });

  it("returns 403 when user is spectator", async () => {
    mockGetServerSession.mockResolvedValue(spectatorSession);

    const { DELETE } = await import("@/app/api/ball/[ballId]/route");
    const res = await DELETE(makeRequest(BALL_ID), makeContext(BALL_ID));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 404 when ball is not found", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);
    mockBallFindByIdAndDelete.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/ball/[ballId]/route");
    const res = await DELETE(makeRequest(BALL_ID), makeContext(BALL_ID));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Ball not found");
  });

  it("deletes ball and updates innings score on success", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);
    mockBallFindByIdAndDelete.mockResolvedValue(mockDeletedBall);
    mockInningsFindByIdAndUpdate.mockResolvedValue({});

    const { DELETE } = await import("@/app/api/ball/[ballId]/route");
    const res = await DELETE(makeRequest(BALL_ID), makeContext(BALL_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Ball deleted");
    expect(body.data).toBeDefined();
  });

  it("decrements wicket count when deleted ball was a wicket", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);
    const wicketBall = { ...mockDeletedBall, isWicket: true };
    mockBallFindByIdAndDelete.mockResolvedValue(wicketBall);
    mockInningsFindByIdAndUpdate.mockResolvedValue({});

    const { DELETE } = await import("@/app/api/ball/[ballId]/route");
    await DELETE(makeRequest(BALL_ID), makeContext(BALL_ID));

    expect(mockInningsFindByIdAndUpdate).toHaveBeenCalledWith(
      INNINGS_ID,
      expect.objectContaining({
        $inc: expect.objectContaining({ wickets: -1 }),
      }),
      expect.anything(),
    );
  });

  it("does NOT decrement wickets when deleted ball was not a wicket", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);
    mockBallFindByIdAndDelete.mockResolvedValue({
      ...mockDeletedBall,
      isWicket: false,
    });
    mockInningsFindByIdAndUpdate.mockResolvedValue({});

    const { DELETE } = await import("@/app/api/ball/[ballId]/route");
    await DELETE(makeRequest(BALL_ID), makeContext(BALL_ID));

    const updateArg = mockInningsFindByIdAndUpdate.mock.calls[0][1];
    expect(updateArg.$inc.wickets).toBeUndefined();
  });

  it("triggers pusher event when matchId is provided", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);
    mockBallFindByIdAndDelete.mockResolvedValue(mockDeletedBall);
    mockInningsFindByIdAndUpdate.mockResolvedValue({});

    const { DELETE } = await import("@/app/api/ball/[ballId]/route");
    await DELETE(makeRequest(BALL_ID, MATCH_ID), makeContext(BALL_ID));

    expect(mockTrigger).toHaveBeenCalledWith(
      `match-${MATCH_ID}`,
      "ball-deleted",
      expect.objectContaining({ ballId: BALL_ID, inningsId: INNINGS_ID }),
    );
  });

  it("does NOT trigger pusher when matchId is absent", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);
    mockBallFindByIdAndDelete.mockResolvedValue(mockDeletedBall);
    mockInningsFindByIdAndUpdate.mockResolvedValue({});

    const { DELETE } = await import("@/app/api/ball/[ballId]/route");
    await DELETE(makeRequest(BALL_ID), makeContext(BALL_ID)); // no matchId

    expect(mockTrigger).not.toHaveBeenCalled();
  });

  it("aborts transaction and returns 500 on DB error", async () => {
    mockGetServerSession.mockResolvedValue(umpireSession);
    mockBallFindByIdAndDelete.mockRejectedValue(new Error("DB failure"));

    const { DELETE } = await import("@/app/api/ball/[ballId]/route");
    const res = await DELETE(makeRequest(BALL_ID), makeContext(BALL_ID));
    expect(res.status).toBe(500);
    expect(mockDbSession.abortTransaction).toHaveBeenCalled();
  });
});
