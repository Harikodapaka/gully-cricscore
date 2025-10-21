import { IBall } from "@/models/Ball";

export const BALLS_PER_OVER = 6;

export const calculateNextBall = (
    lastBall: IBall | null,
): { overNumber: number; ballNumber: number } => {
    const currentOver = lastBall?.overNumber || 0;
    const currentBall = lastBall?.ballNumber || 0;

    // Don't increment ball number if the last ball was an extra
    if (lastBall?.isExtra) {
        return { overNumber: currentOver, ballNumber: currentBall };
    }

    let newBall = currentBall + 1;
    let newOver = currentOver;

    // Move to next over if we've completed 6 balls
    if (newBall > BALLS_PER_OVER) {
        newOver = currentOver + 1;
        newBall = 1;
    }

    return { overNumber: newOver, ballNumber: newBall };
};