import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Match, { IMatch } from "@/models/Match";
import Ball, { IBall } from "@/models/Ball";
import Team, { ITeam } from "@/models/Team";
import Innings, { IInnings } from "@/models/Innings";

interface RouteParams {
    params: Promise<{ matchId: string }>;
}


export interface IMatchLean extends Omit<IMatch, "teams" | "innings"> {
    _id: string; // since lean() gives plain object, _id is often a string
    teams: ITeam[];
    innings: IInnings[];
}

export async function GET(req: NextRequest, context: RouteParams) {
    const { matchId } = await context.params;

    if (!isValidObjectId(matchId)) {
        return NextResponse.json(
            { message: "Invalid match ID format" },
            { status: 400 }
        );
    }

    try {
        await dbConnect();

        const matchDoc = await Match.findById(matchId)
            .populate("teams")
            .populate("innings")
            .lean<IMatchLean>();

        if (!matchDoc) {
            return NextResponse.json(
                { message: "Match not found" },
                { status: 404 }
            );
        }

        // Now TypeScript knows the exact structure
        const inningsWithOvers = await Promise.all(
            matchDoc.innings.map(async (innings) => {
                if (innings.status !== "in-progress") {
                    return innings;
                }

                const lastBall = await Ball.findOne({ inningsId: innings._id })
                    .sort({ overNumber: -1, ballNumber: -1 })
                    .select("overNumber ballNumber")
                    .lean() as IBall | null;

                const oversCompleted = lastBall
                    ? `${lastBall.overNumber}.${lastBall.ballNumber}`
                    : "0.0";

                return {
                    ...innings,
                    oversCompleted
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: {
                ...matchDoc,
                innings: inningsWithOvers
            }
        });
    } catch (error) {
        console.error(`Error fetching match ${matchId}:`, error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch match data",
                error: process.env.NODE_ENV === "development"
                    ? (error instanceof Error ? error.message : "Unknown error")
                    : "Internal server error"
            },
            { status: 500 }
        );
    }
}