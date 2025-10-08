import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Innings from "@/models/Innings";
import Ball from "@/models/Ball";
import { isValidObjectId } from "mongoose";

interface RouteParams {
    params: { inningsId: string };
}

interface BallDocument {
    overNumber: number;
    ballNumber: number;
    [key: string]: any;
}

interface InningsDocument {
    _id: string;
    inningsNumber: number;
    battingTeamId: any;
    bowlingTeamId: any;
    score: number;
    wickets: number;
    status: string;
    startedAt: string;
    totalOvers?: number;
    __v: number;
    [key: string]: any;
}

interface InningsResponse extends InningsDocument {
    oversCompleted: string;
}



export async function GET(
    req: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<InningsResponse | { message: string; error?: string }>> {
    const { inningsId } = params;

    // Validate MongoDB ObjectId format
    if (!isValidObjectId(inningsId)) {
        return NextResponse.json(
            { message: "Invalid innings ID format" },
            { status: 400 }
        );
    }

    try {
        await dbConnect();

        // Fetch innings and last ball in parallel for better performance
        const [inningsDoc, lastBall] = await Promise.all([
            Innings.findById(inningsId)
                .populate("battingTeamId")
                .populate("bowlingTeamId")
                .lean(),
            Ball.findOne({ inningsId })
                .sort({ overNumber: -1, ballNumber: -1 })
                .lean()
        ]);

        if (!inningsDoc) {
            return NextResponse.json(
                { message: "Innings not found" },
                { status: 404 }
            );
        }

        const oversCompleted = lastBall
            ? `${(lastBall as any).overNumber}.${(lastBall as any).ballNumber}`
            : "0.0";

        // Merge innings data with calculated oversCompleted
        const response: InningsResponse = {
            ...(inningsDoc as unknown as InningsDocument),
            oversCompleted
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error(`Error fetching innings ${inningsId}:`, error);

        return NextResponse.json(
            {
                message: "Failed to fetch innings data",
                error: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}