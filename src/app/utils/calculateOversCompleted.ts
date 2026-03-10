// import type { IBall } from "@/models/Ball";

type BallLike = {
  overNumber: number;
  ballNumber: number;
  isExtra: boolean;
};

export const calculateOversCompleted = (ball: BallLike): string => {
  const { overNumber, ballNumber, isExtra } = ball;
  return `${overNumber}.${isExtra ? ballNumber - 1 : ballNumber}`;
};
