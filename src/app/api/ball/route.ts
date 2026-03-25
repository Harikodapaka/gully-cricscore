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
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role === "spectator") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();

    const body = await req.json();

    const {
      inningsId,
      overNumber = 0,
      ballNumber,
      runs = 0,
      isWicket = false,
      isExtra = false,
      extraType = "none",
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

    const innings = await Innings.findById(inningsId);
    if (!innings) {
      return NextResponse.json(
        { message: "Innings not found" },
        { status: 404 },
      );
    }

    const dbSession = await mongoose.startSession();
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
          },
        ],
        { session: dbSession },
      );

      innings.score += runs;
      if (isWicket) innings.wickets += 1;
      await innings.save({ session: dbSession });

      await dbSession.commitTransaction();
    } catch (txError) {
      await dbSession.abortTransaction();
      throw txError;
    } finally {
      dbSession.endSession();
    }

    await pusherServer.trigger(`match-${matchId}`, "score-update", newBall);

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
