import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Innings from "@/models/Innings";
import Team from "@/models/Team";
import Match from "@/models/Match";
import Ball, { IBall } from "@/models/Ball";
import { calculateOversCompleted } from "@/app/utils/calculateOversCompleted";

interface RouteParams {
    params: Promise<{ inningsId: string }>;
}

export async function GET(_req: NextRequest, context: RouteParams) {
    const { inningsId } = await context.params;

    if (!isValidObjectId(inningsId)) {
        return NextResponse.json(
            { message: "Invalid innings ID format" },
            { status: 400 }
        );
    }

    try {
        await dbConnect();

        const [inningsDoc, lastBall] = await Promise.all([
            Innings.findById(inningsId)
                .populate("battingTeamId", "-__v")
                .populate("bowlingTeamId", "-__v")
                .select("-__v")
                .lean()
                .exec(),
            Ball.findOne({ inningsId })
                .sort({ overNumber: -1, ballNumber: -1 })
                .select("overNumber ballNumber")
                .lean()
                .exec()
        ]);

        if (!inningsDoc) {
            return NextResponse.json(
                { message: "Innings not found" },
                { status: 404 }
            );
        }

        const oversCompleted = lastBall
            ? calculateOversCompleted(lastBall as unknown as IBall)
            : "0.0";

        return NextResponse.json({
            ...(inningsDoc as any),
            oversCompleted
        });
    } catch (error) {
        console.error(`Error fetching innings ${inningsId}:`, error);

        return NextResponse.json(
            {
                message: "Failed to fetch innings data",
                error: process.env.NODE_ENV === "development"
                    ? (error instanceof Error ? error.message : "Unknown error")
                    : "Internal server error"
            },
            { status: 500 }
        );
    }
}