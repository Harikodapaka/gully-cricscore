import { BALL_MESSAGES, RUN_MESSAGES } from "./constants";

export const getRunMessage = (runs: number | string): string => {
    return RUN_MESSAGES[runs as keyof typeof RUN_MESSAGES] || `${runs} Runs.`;
};
export const getRunsIcon = (runs: number, isWicket?: boolean, extraType?: string): string => {
    let ballMessage = '';
    switch (extraType) {
        case 'noball':
            ballMessage = `${BALL_MESSAGES[extraType as keyof typeof BALL_MESSAGES]}${runs > 1 ? `+${runs - 1}` : ''}`;
            break;
        case 'wide':
            ballMessage = BALL_MESSAGES[extraType as keyof typeof BALL_MESSAGES];
            break;
        case 'wicket':
            ballMessage = `${BALL_MESSAGES[extraType as keyof typeof BALL_MESSAGES]}${runs > 0 ? `+${runs}` : ''}`;
            break;
    }
    return ballMessage || runs.toString();
};