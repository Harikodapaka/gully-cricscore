import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import dbConnect from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher-server";
import Ball from "@/models/Ball";
import Innings from "@/models/Innings";

export async function POST(req: NextRequest) {
  const t0 = performance.now();
  try {
    // 1. Run auth, body parse, and DB connect in parallel
    const [session, body] = await Promise.all([
      getServerSession(authOptions),
      req.json(),
      dbConnect(),
    ]);
    const t1 = performance.now();
    logger.info(`[Ball POST] auth+body+dbConnect: ${(t1 - t0).toFixed(0)}ms`);

    if (!session || (session.user as { role?: string })?.role === "spectator") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const {
      inningsId,
      overNumber = 0,
      ballNumber,
      runs = 0,
      isWicket = false,
      isExtra = false,
      extraType = "none",
      batsmanName,
      bowlerName,
      matchId,
    } = body;

    if (
      !inningsId ||
      !matchId ||
      typeof overNumber !== "number" ||
      !Number.isFinite(overNumber) ||
      typeof ballNumber !== "number" ||
      !Number.isFinite(ballNumber)
    ) {
      return NextResponse.json(
        {
          message:
            "inningsId, matchId, overNumber, and ballNumber are required.",
        },
        { status: 400 },
      );
    }

    // 2. Fetch innings and start session in parallel
    const [innings, dbSession] = await Promise.all([
      Innings.findById(inningsId),
      mongoose.startSession(),
    ]);
    const t2 = performance.now();
    logger.info(
      `[Ball POST] findInnings+startSession: ${(t2 - t1).toFixed(0)}ms`,
    );

    if (!innings) {
      dbSession.endSession();
      return NextResponse.json(
        { message: "Innings not found" },
        { status: 404 },
      );
    }

    // 3. Transaction: create ball + update innings (kept for fault tolerance)
    dbSession.startTransaction();

    let newBall: InstanceType<typeof Ball>;
    try {
      [newBall] = await Ball.create(
        [
          {
            inningsId,
            overNumber,
            ballNumber,
            runs,
            isWicket,
            isExtra,
            extraType,
            batsmanName,
            bowlerName,
          },
        ],
        { session: dbSession },
      );
      const t3a = performance.now();
      logger.info(`[Ball POST] Ball.create: ${(t3a - t2).toFixed(0)}ms`);

      innings.score += runs;
      if (isWicket) innings.wickets += 1;
      await innings.save({ session: dbSession });
      const t3b = performance.now();
      logger.info(`[Ball POST] innings.save: ${(t3b - t3a).toFixed(0)}ms`);

      await dbSession.commitTransaction();
      const t3c = performance.now();
      logger.info(`[Ball POST] commit: ${(t3c - t3b).toFixed(0)}ms`);
    } catch (txError) {
      await dbSession.abortTransaction();
      throw txError;
    } finally {
      dbSession.endSession();
    }

    const tTotal = performance.now();
    logger.info(`[Ball POST] TOTAL: ${(tTotal - t0).toFixed(0)}ms`);

    // 4. Fire-and-forget Pusher — don't block the response
    pusherServer
      .trigger(`match-${matchId}`, "score-update", newBall)
      .catch((err) => logger.error("Pusher trigger failed:", err));

    return NextResponse.json(
      { message: "Ball created successfully", ball: newBall },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Error creating ball:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
