import type { Types } from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { calculateOversCompleted } from "@/app/utils/calculateOversCompleted";
import dbConnect from "@/lib/mongodb";
import Ball from "@/models/Ball";
import Innings, { type IInnings } from "@/models/Innings";
import Match from "@/models/Match";
import Team from "@/models/Team";

interface MatchRequestBody {
  location: string;
  teamAName: string;
  teamBName: string;
  noOfPlayers: number;
  totalOvers: number;
  tossWonBy: string;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const limit = Number(searchParams.get("limit")) || 0; // 0 = no limit

    // Fetch all matches with populated teams + innings (lean for perf)
    const matches = await Match.find()
      .populate({
        path: "innings",
        options: { lean: true },
      })
      .populate({ path: "teams", options: { lean: true } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get all innings IDs
    const allInningsIds = matches.flatMap((m) =>
      m.innings.map((inn: { _id: Types.ObjectId }) => inn._id),
    );

    // Aggregate to get latest ball per innings
    const latestBalls = await Ball.aggregate([
      { $match: { inningsId: { $in: allInningsIds } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$inningsId",
          overNumber: { $first: "$overNumber" },
          ballNumber: { $first: "$ballNumber" },
        },
      },
    ]);

    const latestBallsMap = new Map(
      latestBalls.map((b) => [b._id.toString(), b]),
    );

    // Attach oversCompleted to each innings.
    // We build a new array rather than mutating match.innings in place —
    // the Mongoose lean type for innings is ObjectId[] which won't accept
    // plain objects back, even though populate() has already replaced them.
    type LeanInnings = { _id: Types.ObjectId; oversCompleted?: string };

    const matchesWithOvers = matches.map((match) => {
      const inningsWithOvers = (match.innings as unknown as LeanInnings[]).map(
        (inn) => {
          const lastBall = latestBallsMap.get(inn._id.toString());
          let oversCompleted = lastBall
            ? calculateOversCompleted(lastBall)
            : "0.0";
          if (lastBall?.ballNumber === 6) {
            oversCompleted = Math.ceil(+oversCompleted).toString();
          }
          return { ...inn, oversCompleted };
        },
      );
      return { ...match, innings: inningsWithOvers };
    });

    return NextResponse.json(matchesWithOvers);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = (await req.json()) as MatchRequestBody;
    const {
      location,
      teamAName,
      teamBName,
      noOfPlayers,
      totalOvers,
      tossWonBy,
    } = body;

    if (
      !location ||
      !teamAName ||
      !teamBName ||
      !noOfPlayers ||
      !totalOvers ||
      !tossWonBy
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Generate default player names
    const defaultPlayers = Array.from(
      { length: noOfPlayers },
      (_, i) => `Player ${i + 1}`,
    );

    // 1️⃣ Create Team A
    const teamA = await Team.create({
      name: teamAName,
      numberOfPlayers: noOfPlayers,
      battingOrder: tossWonBy === "teamA" ? "1st" : "2nd",
      players: defaultPlayers,
    });

    // 2️⃣ Create Team B
    const teamB = await Team.create({
      name: teamBName,
      numberOfPlayers: noOfPlayers,
      battingOrder: tossWonBy === "teamB" ? "1st" : "2nd",
      players: defaultPlayers,
    });

    // 3️⃣ Create Match
    const match = await Match.create({
      location,
      overs: totalOvers,
      status: "in-progress",
      currentInnings: 1,
      teams: [teamA._id, teamB._id],
    });

    // 4️⃣ Create First Innings
    const innings: IInnings = await Innings.create({
      inningsNumber: 1,
      battingTeamId: tossWonBy === "teamA" ? teamA._id : teamB._id,
      bowlingTeamId: tossWonBy === "teamA" ? teamB._id : teamA._id,
      status: "in-progress",
    });

    // 5️⃣ Link Innings to Match
    match.innings.push(innings._id as Types.ObjectId);
    await match.save();

    // 6️⃣ Populate full match data
    const populatedMatch = await Match.findById(match._id)
      .populate("teams")
      .populate({
        path: "innings",
        populate: ["battingTeamId", "bowlingTeamId"],
      });

    return NextResponse.json(populatedMatch, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating match:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
