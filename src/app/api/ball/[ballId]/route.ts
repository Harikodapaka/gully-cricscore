import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import dbConnect from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher-server";
import Ball from "@/models/Ball";
import Innings from "@/models/Innings";

interface RouteParams {
  params: Promise<{ ballId: string }>;
}

export async function DELETE(req: NextRequest, context: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role === "spectator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { ballId } = await context.params;

  await dbConnect();
  if (!ballId) {
    return NextResponse.json({ error: "Missing ballId" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  try {
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    let deleted: InstanceType<typeof Ball> | null;
    try {
      deleted = await Ball.findByIdAndDelete(ballId, { session: dbSession });

      if (!deleted) {
        await dbSession.abortTransaction();
        return NextResponse.json({ error: "Ball not found" }, { status: 404 });
      }

      if (deleted.inningsId) {
        const updateData: { $inc: { score: number; wickets?: number } } = {
          $inc: { score: -deleted.runs },
        };
        if (deleted.isWicket) {
          updateData.$inc.wickets = -1;
        }
        await Innings.findByIdAndUpdate(deleted.inningsId, updateData, {
          session: dbSession,
        });
      }

      await dbSession.commitTransaction();
    } catch (txError) {
      await dbSession.abortTransaction();
      throw txError;
    } finally {
      dbSession.endSession();
    }

    if (matchId && deleted.inningsId) {
      await pusherServer.trigger(`match-${matchId}`, "ball-deleted", {
        ballId: String(deleted._id),
        inningsId: String(deleted.inningsId),
        runs: deleted.runs,
        isWicket: deleted.isWicket,
        overNumber: deleted.overNumber,
        ballNumber: deleted.ballNumber,
      });
    }

    return NextResponse.json({ message: "Ball deleted", data: deleted });
  } catch (error) {
    logger.error("Error deleting ball:", error);
    return NextResponse.json(
      { error: "Failed to delete ball" },
      { status: 500 },
    );
  }
}
