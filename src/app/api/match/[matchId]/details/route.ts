import { isValidObjectId } from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { calculateOversCompleted } from "@/app/utils/calculateOversCompleted";
import dbConnect from "@/lib/mongodb";
import type { IBall } from "@/models/Ball";
import Ball from "@/models/Ball";
import Match from "@/models/Match";
import type { MatchDTO } from "@/types/dto";

interface RouteParams {
  params: Promise<{ matchId: string }>;
}

// Minimal shape of a lean innings doc after populate — avoids Mongoose Document inheritance issues
interface LeanInnings {
  _id: unknown;
  inningsNumber: 1 | 2;
  battingTeamId: unknown;
  bowlingTeamId: unknown;
  score: number;
  wickets: number;
  status: "in-progress" | "completed";
  startedAt: unknown;
  completedAt?: unknown;
  balls?: IBall[];
  oversCompleted?: string;
}

export async function GET(_req: NextRequest, context: RouteParams) {
  const { matchId } = await context.params;

  if (!isValidObjectId(matchId)) {
    return NextResponse.json(
      { message: "Invalid match ID format" },
      { status: 400 },
    );
  }

  try {
    await dbConnect();

    const matchDoc = await Match.findById(matchId)
      .populate({
        path: "teams",
        select: "_id name numberOfPlayers battingOrder players",
      })
      .populate({ path: "innings" })
      .lean();

    if (!matchDoc) {
      return NextResponse.json({ message: "Match not found" }, { status: 404 });
    }

    // Collect all innings IDs to fetch balls in a single query
    const inningsIds = (matchDoc.innings as { _id: unknown }[]).map(
      (i) => i._id,
    );
    const balls = await Ball.find({ inningsId: { $in: inningsIds } })
      .sort({ inningsId: 1, timestamp: -1 })
      .lean<IBall[]>();

    // Group balls by inningsId for quick lookup
    const ballsByInnings: Record<string, IBall[]> = {};
    for (const ball of balls) {
      const key = String(ball.inningsId);
      if (!ballsByInnings[key]) ballsByInnings[key] = [];
      ballsByInnings[key].push(ball as IBall);
    }

    const inningsWithOversAndBalls = (
      matchDoc.innings as unknown as LeanInnings[]
    ).map((innings) => {
      const ballsForInnings = ballsByInnings[String(innings._id)] || [];
      const lastBall = ballsForInnings?.[0]; // balls are sorted desc, so first is latest
      const oversCompleted = lastBall
        ? calculateOversCompleted(lastBall)
        : "0.0";
      return {
        ...innings,
        oversCompleted,
        balls: ballsForInnings,
      };
    });

    // Serialise all ObjectId/_id fields to strings at the API boundary
    const responseData: MatchDTO = {
      _id: String(matchDoc._id),
      location: matchDoc.location,
      overs: matchDoc.overs,
      status: matchDoc.status as MatchDTO["status"],
      currentInnings: matchDoc.currentInnings as MatchDTO["currentInnings"],
      createdAt: String(matchDoc.createdAt),
      completedAt: matchDoc.completedAt
        ? String(matchDoc.completedAt)
        : undefined,
      wonBy: matchDoc.wonBy ? String(matchDoc.wonBy) : undefined,
      winnerMessage: matchDoc.winnerMessage,
      teams: (matchDoc.teams as unknown as Record<string, unknown>[]).map(
        (t) => {
          const numPlayers = Number(t.numberOfPlayers);
          const existingPlayers = (t.players as string[]) || [];
          // Ensure players array has entries for all players (backfill defaults)
          const players = Array.from(
            { length: numPlayers },
            (_, i) => existingPlayers[i] || `Player ${i + 1}`,
          );
          return {
            _id: String(t._id),
            name: String(t.name),
            numberOfPlayers: numPlayers,
            battingOrder: t.battingOrder as "1st" | "2nd",
            players,
          };
        },
      ),
      innings: inningsWithOversAndBalls.map((inn) => ({
        _id: String(inn._id),
        inningsNumber: inn.inningsNumber as 1 | 2,
        battingTeamId: String(inn.battingTeamId),
        bowlingTeamId: String(inn.bowlingTeamId),
        score: Number(inn.score),
        wickets: Number(inn.wickets),
        oversCompleted: String(inn.oversCompleted),
        status: inn.status as "in-progress" | "completed",
        startedAt: String(inn.startedAt),
        completedAt: inn.completedAt ? String(inn.completedAt) : undefined,
        balls: ((inn.balls ?? []) as IBall[]).map((b) => ({
          _id: String(b._id),
          inningsId: String(b.inningsId),
          overNumber: b.overNumber,
          ballNumber: b.ballNumber,
          runs: b.runs,
          isWicket: b.isWicket,
          isExtra: b.isExtra,
          extraType: b.extraType as "none" | "wide" | "noball",
          batsmanName: b.batsmanName,
          bowlerName: b.bowlerName,
          timestamp: String(b.timestamp),
        })),
      })),
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error(`Error fetching match ${matchId}:`, error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch match data",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : "Internal server error",
      },
      { status: 500 },
    );
  }
}
