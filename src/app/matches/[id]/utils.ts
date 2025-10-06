import { BALL_MESSAGES, RUN_MESSAGES } from "./constants";

export const getRunMessage = (runs: number | string): string => {
    return RUN_MESSAGES[runs as keyof typeof RUN_MESSAGES] || `${runs} Runs.`;
};
export const getRunsIcon = (runs: number | string): string => {
    return `${isNaN(+runs) ? BALL_MESSAGES[runs as keyof typeof BALL_MESSAGES] : runs}`;
};