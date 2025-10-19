import { IBall } from "@/models/Ball";

export const calculateOversCompleted = (ball: IBall): string => {
    const { overNumber, ballNumber, isExtra } = ball;
    return `${overNumber}.${isExtra ? ballNumber - 1 : ballNumber}`;
}