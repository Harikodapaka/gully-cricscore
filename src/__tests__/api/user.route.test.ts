import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const mockUserFindOneAndUpdate = vi.fn();
vi.mock("@/models/User", () => ({
  default: {
    findOneAndUpdate: (...args: unknown[]) => mockUserFindOneAndUpdate(...args),
  },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ADMIN_SESSION = { user: { role: "admin" } };
const UMPIRE_SESSION = { user: { role: "umpire" } };
const USER_ID = "64f5000000000000000000f1";

const makePatch = (body: object) =>
  new NextRequest("http://localhost/api/user", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

describe("PATCH /api/user", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when no session exists", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/user/route");
    const res = await PATCH(makePatch({ userId: USER_ID, newRole: "umpire" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not an admin", async () => {
    mockGetServerSession.mockResolvedValue(UMPIRE_SESSION);

    const { PATCH } = await import("@/app/api/user/route");
    const res = await PATCH(
      makePatch({ userId: USER_ID, newRole: "spectator" }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/Forbidden/i);
  });

  it("returns 400 when userId is missing", async () => {
    mockGetServerSession.mockResolvedValue(ADMIN_SESSION);

    const { PATCH } = await import("@/app/api/user/route");
    const res = await PATCH(makePatch({ newRole: "umpire" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing userId or newRole");
  });

  it("returns 400 when newRole is missing", async () => {
    mockGetServerSession.mockResolvedValue(ADMIN_SESSION);

    const { PATCH } = await import("@/app/api/user/route");
    const res = await PATCH(makePatch({ userId: USER_ID }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when user is not found in DB", async () => {
    mockGetServerSession.mockResolvedValue(ADMIN_SESSION);
    mockUserFindOneAndUpdate.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/user/route");
    const res = await PATCH(makePatch({ userId: USER_ID, newRole: "umpire" }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("User not found");
  });

  it("updates the user role and returns 200 on success", async () => {
    mockGetServerSession.mockResolvedValue(ADMIN_SESSION);
    const updatedUser = {
      _id: USER_ID,
      email: "test@example.com",
      role: "umpire",
    };
    mockUserFindOneAndUpdate.mockResolvedValue(updatedUser);

    const { PATCH } = await import("@/app/api/user/route");
    const res = await PATCH(makePatch({ userId: USER_ID, newRole: "umpire" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Role updated");
    expect(body.user.role).toBe("umpire");
  });

  it("calls findOneAndUpdate with correct query and update", async () => {
    mockGetServerSession.mockResolvedValue(ADMIN_SESSION);
    mockUserFindOneAndUpdate.mockResolvedValue({
      _id: USER_ID,
      role: "spectator",
    });

    const { PATCH } = await import("@/app/api/user/route");
    await PATCH(makePatch({ userId: USER_ID, newRole: "spectator" }));

    expect(mockUserFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: USER_ID },
      { role: "spectator" },
      { new: true },
    );
  });

  it("returns 500 when DB throws", async () => {
    mockGetServerSession.mockResolvedValue(ADMIN_SESSION);
    mockUserFindOneAndUpdate.mockRejectedValue(new Error("DB error"));

    const { PATCH } = await import("@/app/api/user/route");
    const res = await PATCH(makePatch({ userId: USER_ID, newRole: "umpire" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to update role");
  });
});
