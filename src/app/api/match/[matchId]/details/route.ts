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
            .populate({ path: "teams", select: "_id name numberOfPlayers" })
            .populate({ path: "innings" })
            .lean<IMatchLean>();

        if (!matchDoc) {
            return NextResponse.json(
                { message: "Match not found" },
                { status: 404 }
            );
        }

        // Collect all innings IDs to fetch balls in a single query
        const inningsIds = matchDoc.innings.map((innings) => innings._id);
        const balls = await Ball.find({ inningsId: { $in: inningsIds } })
            .sort({ inningsId: 1, overNumber: -1, ballNumber: -1 })
            .lean<IBall[]>();

        // Group balls by inningsId for quick lookup
        const ballsByInnings: Record<string, IBall[]> = {};
        for (const ball of balls) {
            const key = String(ball.inningsId);
            if (!ballsByInnings[key]) ballsByInnings[key] = [];
            ballsByInnings[key].push(ball as IBall);
        }

        const inningsWithOversAndBalls = matchDoc.innings.map((innings) => {
            const ballsForInnings = ballsByInnings[String(innings._id)] || [];
            const lastBall = ballsForInnings?.[0]; // balls are sorted desc, so first is latest
            const oversCompleted = lastBall
                ? `${lastBall.overNumber}.${lastBall.ballNumber}`
                : "0.0";
            return {
                ...innings,
                oversCompleted,
                balls: ballsForInnings
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                ...matchDoc,
                innings: inningsWithOversAndBalls
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