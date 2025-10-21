import { BALLS_PER_OVER } from "./calculateNextBall";

export const calculateBallsRemaining = (totalOvers: number, oversCompleted: string): number => {
    const [completedOvers, completedBalls] = oversCompleted.split('.').map(Number);
    const totalBalls = totalOvers * BALLS_PER_OVER;
    const ballsPlayed = completedOvers * BALLS_PER_OVER + (completedBalls || 0);
    return totalBalls - ballsPlayed;
};