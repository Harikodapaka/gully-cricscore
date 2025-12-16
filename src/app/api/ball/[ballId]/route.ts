import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Ball from '@/models/Ball';
import Innings from '@/models/Innings';
import Match from '@/models/Match';
import { pusherServer } from '@/lib/pusher-server';

interface RouteParams {
    params: Promise<{ ballId: string }>;
}

export async function DELETE(_req: NextRequest, context: RouteParams) {
    const { ballId } = await context.params;

    await dbConnect();
    if (!ballId) {
        return NextResponse.json({ error: 'Missing ballId' }, { status: 400 });
    }
    try {
        const deleted = await Ball.findByIdAndDelete(ballId);
        console.log("ballId to delete:", ballId, "Deleted ball:", deleted);
        
        if (!deleted) {
            return NextResponse.json({ error: 'Ball not found' }, { status: 404 });
        }

        // Update innings stats
        if (deleted.inningsId) {
            const updateData: { $inc: { score: number; wickets?: number } } = {
                $inc: { score: -deleted.runs }
            };
            
            // Decrement wickets if the deleted ball was a wicket
            if (deleted.isWicket) {
                updateData.$inc.wickets = -1;
            }
            
            await Innings.findByIdAndUpdate(
                deleted.inningsId,
                updateData
            );

            // Find matchId from the innings
            const match = await Match.findOne({ innings: deleted.inningsId }).lean();
            const matchId = match?._id?.toString();

            // Trigger Pusher event for real-time updates
            if (matchId) {
                await pusherServer.trigger(`match-${matchId}`, "ball-deleted", {
                    ballId: String(deleted._id),
                    inningsId: String(deleted.inningsId),
                    runs: deleted.runs,
                    isWicket: deleted.isWicket,
                    overNumber: deleted.overNumber,
                    ballNumber: deleted.ballNumber,
                });
            }
        }

        return NextResponse.json({ message: 'Ball deleted', data: deleted });
    } catch (error) {
        console.error('Error deleting ball:', error);
        return NextResponse.json({ error: 'Failed to delete ball' }, { status: 500 });
    }
}
