import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Ball from '@/models/Ball';
import Innings from '@/models/Innings';

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
        if (deleted && deleted.inningsId && deleted.runs !== undefined) {
            await Innings.findByIdAndUpdate(
                deleted.inningsId,
                { $inc: { score: -deleted.runs } }
            );
        }
        if (!deleted) {
            return NextResponse.json({ error: 'Ball not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Ball deleted', data: deleted });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete ball' }, { status: 500 });
    }
}
