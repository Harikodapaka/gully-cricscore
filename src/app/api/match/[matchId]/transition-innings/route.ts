import { isValidObjectId, type Types } from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import dbConnect from "@/lib/mongodb";
import Innings from "@/models/Innings";
import Match, { type IMatch } from "@/models/Match";
import type { ITeam } from "@/models/Team";

interface RouteParams {
  params: Promise<{ matchId: string }>;
}

type SuccessResponse = {
  message: string;
  data?: IMatch;
};

type ErrorResponse = {
  message: string;
  error?: string;
};

type PopulatedInnings = {
  _id: Types.ObjectId;
  inningsNumber: number;
  status: string;
};

export async function PATCH(
  // biome-ignore lint/correctness/noUnusedFunctionParameters: required
  req: NextRequest,
  context: RouteParams,
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  const { matchId } = await context.params;

  if (!isValidObjectId(matchId)) {
    return NextResponse.json(
      { message: "Invalid match ID format" },
      { status: 400 },
    );
  }

  try {
    await dbConnect();

    const match = await Match.findById(matchId)
      .populate("innings")
      .populate("teams")
      .exec();

    if (!match) {
      return NextResponse.json({ message: "Match not found" }, { status: 404 });
    }

    if (match.status === "completed") {
      return NextResponse.json(
        { message: "Match is already completed" },
        { status: 400 },
      );
    }

    const currentInnings = (
      match.innings as unknown as PopulatedInnings[]
    ).find((inn) => inn.inningsNumber === match.currentInnings);

    if (!currentInnings) {
      return NextResponse.json(
        { message: "Current innings not found" },
        { status: 404 },
      );
    }

    if (currentInnings.status === "completed") {
      return NextResponse.json(
        { message: "Current innings is already completed" },
        { status: 400 },
      );
    }

    const completedInnings = await Innings.findByIdAndUpdate(
      currentInnings._id,
      { status: "completed", completedAt: new Date() },
      { new: true },
    ).exec();

    if (!completedInnings) {
      return NextResponse.json(
        { message: "Failed to complete innings" },
        { status: 500 },
      );
    }

    if (match.currentInnings === 2) {
      let wonBy: string | undefined;
      let winnerMessage: string | undefined;

      const [firstInnings, secondInnings] = await Innings.find({
        _id: { $in: match.innings.map((i: { _id: Types.ObjectId }) => i._id) },
      })
        .sort({ inningsNumber: 1 })
        .lean();

      if (firstInnings && secondInnings) {
        logger.debug(
          "Scores — first:",
          firstInnings.score,
          "second:",
          secondInnings.score,
        );

        if (secondInnings.score > firstInnings.score) {
          wonBy = String(secondInnings.battingTeamId);
          const runDiff = secondInnings.score - firstInnings.score;
          const winningTeam = (match.teams as unknown as ITeam[]).find(
            (team) => String(team._id) === String(secondInnings.battingTeamId),
          );
          logger.debug("Winner:", winningTeam?.name);
          winnerMessage = `${winningTeam?.name ?? "Team 2"} won by ${runDiff} run${runDiff !== 1 ? "s" : ""}`;
        } else if (secondInnings.score < firstInnings.score) {
          wonBy = String(firstInnings.battingTeamId);
          const runDiff = firstInnings.score - secondInnings.score;
          const winningTeam = (match.teams as unknown as ITeam[]).find(
            (team) => String(team._id) === String(firstInnings.battingTeamId),
          );
          logger.debug("Winner:", winningTeam?.name);
          winnerMessage = `${winningTeam?.name ?? "Team 1"} won by ${runDiff} run${runDiff !== 1 ? "s" : ""}`;
        } else {
          winnerMessage = "Match tied";
        }
      }

      await Match.findByIdAndUpdate(matchId, {
        status: "completed",
        completedAt: new Date(),
        wonBy,
        winnerMessage,
      }).exec();

      return NextResponse.json(
        { message: "Match completed successfully" },
        { status: 200 },
      );
    }

    const teams = match.teams as unknown as ITeam[];
    const battingTeam = teams.find((t) => t.battingOrder === "2nd");
    const bowlingTeam = teams.find((t) => t.battingOrder === "1st");

    if (!battingTeam || !bowlingTeam) {
      return NextResponse.json(
        { message: "Teams configuration error" },
        { status: 500 },
      );
    }

    const newInnings = await Innings.create({
      inningsNumber: 2,
      battingTeamId: battingTeam._id,
      bowlingTeamId: bowlingTeam._id,
      score: 0,
      wickets: 0,
      status: "in-progress",
      startedAt: new Date(),
    });

    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      { currentInnings: 2, $push: { innings: newInnings._id } },
      { new: true },
    )
      .populate("teams")
      .populate("innings")
      .exec();

    if (!updatedMatch) {
      return NextResponse.json(
        { message: "Failed to update match" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Innings transition successful",
      data: updatedMatch.toObject(),
    });
  } catch (error) {
    logger.error(`Error transitioning innings for match ${matchId}:`, error);

    if (error instanceof Error) {
      if (error.name === "CastError") {
        return NextResponse.json(
          { message: "Invalid match ID format" },
          { status: 400 },
        );
      }
      if (error.name === "MongoNetworkError") {
        return NextResponse.json(
          { message: "Database connection failed" },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      {
        message: "Failed to transition innings",
        ...(process.env.NODE_ENV === "development" && {
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 },
    );
  }
}
