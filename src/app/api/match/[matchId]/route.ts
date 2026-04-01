import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import Team from "@/models/Team";

interface RouteParams {
  params: Promise<{ matchId: string }>;
}

export async function PATCH(req: NextRequest, context: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role === "spectator") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { matchId } = await context.params;

  try {
    await dbConnect();

    const body = await req.json();
    const { overs, numberOfPlayers } = body;

    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json({ message: "Match not found" }, { status: 404 });
    }

    if (match.status === "completed") {
      return NextResponse.json(
        { message: "Cannot edit a completed match" },
        { status: 400 },
      );
    }

    if (overs !== undefined) {
      if (typeof overs !== "number" || overs < 1 || overs > 50) {
        return NextResponse.json(
          { message: "Overs must be between 1 and 50" },
          { status: 400 },
        );
      }
      match.overs = overs;
    }

    if (numberOfPlayers !== undefined) {
      if (
        typeof numberOfPlayers !== "number" ||
        numberOfPlayers < 2 ||
        numberOfPlayers > 11
      ) {
        return NextResponse.json(
          { message: "Number of players must be between 2 and 11" },
          { status: 400 },
        );
      }

      // Update both teams' numberOfPlayers and resize their players arrays
      for (const teamId of match.teams) {
        const team = await Team.findById(teamId);
        if (team) {
          const oldCount = team.numberOfPlayers;
          team.numberOfPlayers = numberOfPlayers;

          // Backfill players array if it's shorter than oldCount (legacy teams)
          while (team.players.length < oldCount) {
            team.players.push(`Player ${team.players.length + 1}`);
          }

          if (numberOfPlayers > oldCount) {
            // Add new default player names
            for (let i = oldCount; i < numberOfPlayers; i++) {
              team.players.push(`Player ${i + 1}`);
            }
          } else if (numberOfPlayers < oldCount) {
            // Trim players array
            team.players = team.players.slice(0, numberOfPlayers);
          }

          team.markModified("players");
          await team.save();
        }
      }
    }

    await match.save();

    return NextResponse.json({
      message: "Match updated successfully",
      data: match,
    });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
