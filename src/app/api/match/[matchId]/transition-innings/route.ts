import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Match, { IMatch } from "@/models/Match";
import Innings from "@/models/Innings";

interface RouteParams {
    params: Promise<{ matchId: string }>;
}

type SuccessResponse = {
    message: string;
    data: IMatch;
};

type ErrorResponse = {
    message: string;
    error?: string;
};

export async function PATCH(
    req: NextRequest,
    context: RouteParams
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
    const { matchId } = await context.params;

    if (!isValidObjectId(matchId)) {
        return NextResponse.json(
            { message: "Invalid match ID format" },
            { status: 400 }
        );
    }

    try {
        await dbConnect();

        // Fetch the match with populated innings
        const match = await Match.findById(matchId)
            .populate("innings")
            .populate("teams")
            .exec();

        if (!match) {
            return NextResponse.json(
                { message: "Match not found" },
                { status: 404 }
            );
        }

        if (match.status === "completed") {
            return NextResponse.json(
                { message: "Match is already completed" },
                { status: 400 }
            );
        }

        // Find the current innings
        const currentInnings = (match.innings as any[]).find(
            (inn: any) => inn.inningsNumber === match.currentInnings
        );

        if (!currentInnings) {
            return NextResponse.json(
                { message: "Current innings not found" },
                { status: 404 }
            );
        }

        if (currentInnings.status === "completed") {
            return NextResponse.json(
                { message: "Current innings is already completed" },
                { status: 400 }
            );
        }

        // Complete the current innings
        const completedInnings = await Innings.findByIdAndUpdate(
            currentInnings._id,
            {
                status: "completed",
                completedAt: new Date()
            },
            { new: true }
        ).exec();

        if (!completedInnings) {
            return NextResponse.json(
                { message: "Failed to complete innings" },
                { status: 500 }
            );
        }

        // Check if this was the second innings (match is now complete)
        if (match.currentInnings === 2) {

            // Determine winner and message
            let wonBy: string | undefined = undefined;
            let winnerMessage: string | undefined = undefined;

            // Assuming both innings are present and completed
            const [firstInnings, secondInnings] = (match.innings as any[]).sort(
                (a, b) => a.inningsNumber - b.inningsNumber
            );

            if (firstInnings && secondInnings) {
                console.log("secondInnings.score:", secondInnings.score);
                console.log("firstInnings.score:", firstInnings.score);

                if (secondInnings.score > firstInnings.score) {
                    // Second batting team wins
                    wonBy = String(secondInnings.battingTeamId);
                    const runs = secondInnings.score - firstInnings.score;
                    const winningTeam = (match.teams as any[]).find(
                        (team: any) => String(team._id) === String(secondInnings.battingTeamId)
                    );
                    console.log("winningTeam:", winningTeam.name, secondInnings.battingTeamId);

                    winnerMessage = `${winningTeam?.name || "Team 2"} won by ${runs} runs`;
                } else if (secondInnings.score < firstInnings.score) {
                    // First batting team wins
                    wonBy = String(firstInnings.battingTeamId);
                    const runs = firstInnings.score - secondInnings.score;
                    const winningTeam = (match.teams as any[]).find(
                        (team: any) => String(team._id) === String(firstInnings.battingTeamId)
                    );
                    console.log("winningTeam:", winningTeam.name, firstInnings.battingTeamId);

                    winnerMessage = `${winningTeam?.name || "Team 1"} won by ${runs} runs`;
                } else {
                    // Tie
                    winnerMessage = "Match tied";
                }
            }

            await Match.findByIdAndUpdate(
                matchId,
                {
                    status: "completed",
                    completedAt: new Date(),
                    wonBy,
                    winnerMessage
                }
            ).exec();
            await Match.findByIdAndUpdate(
                matchId,
                {
                    status: "completed",
                    completedAt: new Date()
                }
            ).exec();

            return NextResponse.json(
                { message: "Match completed successfully" },
                { status: 200 }
            );
        }

        // Create new innings (switch teams)
        const teams = match.teams as any[];
        const battingTeam = teams.find((t: any) => t.battingOrder === "2nd");
        const bowlingTeam = teams.find((t: any) => t.battingOrder === "1st");

        if (!battingTeam || !bowlingTeam) {
            return NextResponse.json(
                { message: "Teams configuration error" },
                { status: 500 }
            );
        }

        const newInnings = await Innings.create({
            inningsNumber: 2,
            battingTeamId: battingTeam._id,
            bowlingTeamId: bowlingTeam._id,
            score: 0,
            wickets: 0,
            status: "in-progress",
            startedAt: new Date()
        });

        // Update match with new innings
        const updatedMatch = await Match.findByIdAndUpdate(
            matchId,
            {
                currentInnings: 2,
                $push: { innings: newInnings._id }
            },
            { new: true }
        )
            .populate("teams")
            .populate("innings")
            .exec();

        if (!updatedMatch) {
            return NextResponse.json(
                { message: "Failed to update match" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Innings transition successful",
            data: updatedMatch.toObject()
        });
    } catch (error) {
        console.error(`Error transitioning innings for match ${matchId}:`, error);

        if (error instanceof Error) {
            if (error.name === "CastError") {
                return NextResponse.json(
                    { message: "Invalid match ID format" },
                    { status: 400 }
                );
            }

            if (error.name === "MongoNetworkError") {
                return NextResponse.json(
                    { message: "Database connection failed" },
                    { status: 503 }
                );
            }
        }

        return NextResponse.json(
            {
                message: "Failed to transition innings",
                ...(process.env.NODE_ENV === "development" && {
                    error: error instanceof Error ? error.message : "Unknown error"
                })
            },
            { status: 500 }
        );
    }
}