import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Ball from "@/models/Ball";
import Innings from "@/models/Innings";

export async function POST(req: NextRequest) {
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
        } = body;

        // Validation
        if (!inningsId || isNaN(overNumber?.toString()) || isNaN(ballNumber.toString())) {
            return NextResponse.json(
                { message: "inningsId, overNumber, and ballNumber are required." },
                { status: 400 }
            );
        }

        // Ensure the innings exists
        const innings = await Innings.findById(inningsId);
        if (!innings) {
            return NextResponse.json({ message: "Innings not found" }, { status: 404 });
        }

        // Create new ball
        const newBall = await Ball.create({
            inningsId,
            overNumber,
            ballNumber,
            runs,
            isWicket,
            isExtra,
            extraType,
        });

        // Update innings stats
        innings.score += runs;
        if (isWicket) innings.wickets += 1;
        await innings.save();

        return NextResponse.json(
            {
                message: "Ball created successfully",
                ball: newBall,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating ball:", error);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}