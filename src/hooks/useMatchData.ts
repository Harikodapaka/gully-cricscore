"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { formatOversCompleted } from "@/app/utils/formatOversCompleted";
import { matchApi } from "@/services/matchApi";
import type { BallDTO, InningsDTO, MatchDTO, TeamDTO } from "@/types/dto";
import { showToast } from "@/utils/toast";

export interface ScoreState {
  runs: number;
  wickets: number;
  oversCompleted: string;
}

export interface UseMatchDataReturn {
  match: MatchDTO | undefined;
  teamDetails: TeamDTO | undefined;
  inningsData: InningsDTO | undefined;
  scoreState: ScoreState;
  lastBallSaved: BallDTO | null;
  loading: boolean;
  setScoreState: React.Dispatch<React.SetStateAction<ScoreState>>;
  setLastBallSaved: React.Dispatch<React.SetStateAction<BallDTO | null>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchMatchData: () => Promise<void>;
}

export function useMatchData(
  matchId: string | string[] | undefined,
): UseMatchDataReturn {
  const router = useRouter();

  const [match, setMatch] = useState<MatchDTO>();
  const [teamDetails, setTeamDetails] = useState<TeamDTO>();
  const [inningsData, setInningsData] = useState<InningsDTO>();
  const [scoreState, setScoreState] = useState<ScoreState>({
    runs: 0,
    wickets: 0,
    oversCompleted: "0.0",
  });
  const [lastBallSaved, setLastBallSaved] = useState<BallDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchMatchData = useCallback(async () => {
    if (!matchId || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const matchData = await matchApi.fetchMatchDetails(matchId);
      const fetchedMatch = matchData.data;

      setMatch(fetchedMatch);

      const currentInningsIndex = (fetchedMatch.currentInnings ?? 1) - 1;
      const currentInnings = fetchedMatch.innings[currentInningsIndex];

      setInningsData(currentInnings);

      const battingTeam = fetchedMatch.teams.find(
        (t) => t._id === currentInnings.battingTeamId,
      );

      setTeamDetails(battingTeam);
      setScoreState({
        runs: currentInnings.score || 0,
        wickets: currentInnings.wickets || 0,
        oversCompleted: formatOversCompleted(currentInnings.oversCompleted),
      });

      const lastBall =
        currentInnings?.balls && currentInnings.balls.length > 0
          ? currentInnings.balls[0]
          : null;
      setLastBallSaved(lastBall);
    } catch (error) {
      console.error("Error fetching match:", error);
      setMatch(undefined);
      showToast("Error fetching match", "error");
      router.push("/");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [matchId, router]);

  return {
    match,
    teamDetails,
    inningsData,
    scoreState,
    lastBallSaved,
    loading,
    setScoreState,
    setLastBallSaved,
    setLoading,
    fetchMatchData,
  };
}
