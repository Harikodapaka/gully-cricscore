import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function PATCH(request: NextRequest) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Only admin can update roles' }, { status: 403 });
    }
    const { userId, newRole } = await request.json();
    if (!userId || !newRole) {
        return NextResponse.json({ error: 'Missing userId or newRole' }, { status: 400 });
    }
    try {
        const user = await User.findOneAndUpdate(
            { _id: userId },
            { role: newRole },
            { new: true }
        );
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Role updated', user });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }
}
