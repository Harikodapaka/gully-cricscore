import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Ball from "@/models/Ball";
import Innings from "@/models/Innings";
import Team from "@/models/Team";

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

export async function PATCH(req: NextRequest, context: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role === "spectator") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { teamId } = await context.params;

  try {
    await dbConnect();

    const body = await req.json();
    const { playerIndex, playerName, matchId } = body;

    if (
      typeof playerIndex !== "number" ||
      typeof playerName !== "string" ||
      !playerName.trim()
    ) {
      return NextResponse.json(
        {
          message:
            "playerIndex (number) and playerName (non-empty string) are required",
        },
        { status: 400 },
      );
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    if (playerIndex < 0 || playerIndex >= team.numberOfPlayers) {
      return NextResponse.json(
        { message: "Player index out of range" },
        { status: 400 },
      );
    }

    // Ensure players array is long enough
    while (team.players.length <= playerIndex) {
      team.players.push(`Player ${team.players.length + 1}`);
    }

    const oldName = team.players[playerIndex];
    const newName = playerName.trim();

    team.players[playerIndex] = newName;
    team.markModified("players");
    await team.save();

    // Bulk-update all balls in this match that reference the old name
    if (matchId && oldName && oldName !== newName) {
      // Find all innings where this team is batting or bowling
      const battingInnings = await Innings.find({ battingTeamId: teamId })
        .select("_id")
        .lean();
      const bowlingInnings = await Innings.find({ bowlingTeamId: teamId })
        .select("_id")
        .lean();

      const battingIds = battingInnings.map((i) => i._id);
      const bowlingIds = bowlingInnings.map((i) => i._id);

      // Update batsmanName on balls where this team was batting
      if (battingIds.length > 0) {
        await Ball.updateMany(
          { inningsId: { $in: battingIds }, batsmanName: oldName },
          { $set: { batsmanName: newName } },
        );
      }

      // Update bowlerName on balls where this team was bowling
      if (bowlingIds.length > 0) {
        await Ball.updateMany(
          { inningsId: { $in: bowlingIds }, bowlerName: oldName },
          { $set: { bowlerName: newName } },
        );
      }
    }

    return NextResponse.json({
      message: "Player updated",
      data: { _id: String(team._id), players: team.players },
    });
  } catch (error) {
    console.error("Error updating team player:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
