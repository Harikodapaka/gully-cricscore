import { formatOversCompleted } from "@/app/utils/formatOversCompleted";

export interface InningsCompletionStatus {
  isAllOut: boolean;
  isOversCompleted: boolean;
}

export const getInningsCompletionStatus = (
  teamPlayers: number,
  wickets: number,
  totalOvers: number,
  oversCompleted: string,
): InningsCompletionStatus => {
  const completedOvers = Number(
    formatOversCompleted(oversCompleted).split(".")[0],
  );
  return {
    isAllOut: teamPlayers === wickets,
    isOversCompleted: totalOvers === completedOvers,
  };
};

export const hasSecondInningsWon = (
  firstInningsScore: number | undefined,
  currentRuns: number,
): boolean =>
  firstInningsScore !== undefined && currentRuns > firstInningsScore;
