"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateOversCompleted } from "@/app/utils/calculateOversCompleted";
import LoadingOverlay from "@/components/LoadingOverlay";
import { PageContainer } from "@/components/Styles";
import { TabSwitcher } from "@/components/TabSwitcher";
import { INNINGS, MATCH_STATUS } from "@/constants/match";
// Import the exported type instead of re-declaring it locally
import {
  type BallDeletedPayload,
  usePusherMatchUpdates,
} from "@/hooks/usePusherMatchUpdates";
import { matchApi } from "@/services/matchApi";
import type { BallDTO, MatchDTO } from "@/types/dto";
import { showToast } from "@/utils/toast";
import { toId } from "@/utils/toId";
import { InningsDisplay } from "./InningsDisplay";
import { ScoreCard } from "./scoreCard";

export default function MatchDetails() {
  const [matchData, setMatchData] = useState<MatchDTO | null>(null);
  const [selectedInnings, setSelectedInnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track disconnected state to show stale-data warning to spectators
  const [isReconnecting, setIsReconnecting] = useState(false);
  // Only show reconnecting banner if we were previously connected — not on initial load
  const wasConnectedRef = useRef(false);
  const params = useParams();

  const fetchMatch = useCallback(async () => {
    if (!params?.id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await matchApi.fetchMatchDetails(params.id);
      setMatchData(data.data);
      if (
        data.data.currentInnings === INNINGS.SECOND &&
        data.data.status === MATCH_STATUS.IN_PROGRESS
      ) {
        setSelectedInnings(1);
      }
    } catch (err) {
      console.error("Error fetching match:", err);
      setError("Failed to load match data");
      showToast("Error fetching match", "error");
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  const handleScoreUpdate = useCallback((ball: BallDTO) => {
    setMatchData((prev) => {
      if (!prev) return null;

      const inningsIndex = prev.innings.findIndex(
        (innings) => String(innings._id) === String(ball.inningsId),
      );

      if (inningsIndex === -1) return prev;

      const currentInnings = prev.innings[inningsIndex];
      const updatedInnings = [...prev.innings];
      updatedInnings[inningsIndex] = {
        ...currentInnings,
        score: (currentInnings.score || 0) + (ball.runs || 0),
        wickets: ball.isWicket
          ? (currentInnings.wickets || 0) + 1
          : currentInnings.wickets || 0,
        oversCompleted: calculateOversCompleted(ball),
        balls: [ball, ...(currentInnings?.balls ?? [])],
      };

      return { ...prev, innings: updatedInnings };
    });
  }, []);

  // Task 13: BallDeletedPayload imported from hook — no more local re-declaration
  const handleBallDeleted = useCallback((payload: BallDeletedPayload) => {
    setMatchData((prev) => {
      if (!prev) return null;

      const inningsIndex = prev.innings.findIndex(
        (innings) => String(innings._id) === String(payload.inningsId),
      );

      if (inningsIndex === -1) return prev;

      const currentInnings = prev.innings[inningsIndex];
      const updatedBalls = (currentInnings?.balls ?? []).filter(
        (ball) => String(ball._id) !== payload.ballId,
      );

      const lastBall = updatedBalls.length > 0 ? updatedBalls[0] : null;
      const newOversCompleted = lastBall
        ? calculateOversCompleted(lastBall)
        : "0.0";

      const updatedInnings = [...prev.innings];
      updatedInnings[inningsIndex] = {
        ...currentInnings,
        score: Math.max(0, (currentInnings.score || 0) - payload.runs),
        wickets: payload.isWicket
          ? Math.max(0, (currentInnings.wickets || 0) - 1)
          : currentInnings.wickets || 0,
        oversCompleted: newOversCompleted,
        balls: updatedBalls,
      };

      return { ...prev, innings: updatedInnings };
    });
  }, []);

  // On reconnect, re-fetch fresh match data and clear the warning banner
  const handleReconnect = useCallback(async () => {
    wasConnectedRef.current = false;
    setIsReconnecting(false);
    await fetchMatch();
    showToast("Reconnected — scores refreshed", "success");
  }, [fetchMatch]);

  const { isConnected } = usePusherMatchUpdates({
    matchId: params?.id,
    matchStatus: matchData?.status,
    onScoreUpdate: handleScoreUpdate,
    onBallDeleted: handleBallDeleted,
    onReconnect: handleReconnect,
  });

  // Show reconnecting banner when connection drops during a live match.
  // wasConnectedRef guards against showing the banner on initial load before
  // the Pusher channel has had a chance to subscribe.
  useEffect(() => {
    if (matchData?.status !== MATCH_STATUS.IN_PROGRESS) return;
    if (isConnected) {
      wasConnectedRef.current = true;
      setIsReconnecting(false);
    } else if (wasConnectedRef.current) {
      setIsReconnecting(true);
    }
  }, [isConnected, matchData?.status]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  // Task 14: teamsById uses string keys — no String() casts needed downstream
  const teamsById = useMemo(() => {
    if (!matchData?.teams)
      return new Map<string, { _id: string; name: string }>();
    return new Map(
      matchData.teams.map((team) => [
        String(team._id),
        { _id: String(team._id), name: String(team.name) },
      ]),
    );
  }, [matchData?.teams]);

  const { firstInnings, secondInnings } = useMemo(
    () => ({
      firstInnings: matchData?.innings?.[0],
      secondInnings: matchData?.innings?.[1],
    }),
    [matchData?.innings],
  );

  const { teamA, teamB } = useMemo(() => {
    const isInProgress = matchData?.status === MATCH_STATUS.IN_PROGRESS;

    return {
      teamA: {
        name:
          teamsById.get(toId(firstInnings?.battingTeamId))?.name || "Team A",
        runs: firstInnings?.score || 0,
        wickets: firstInnings?.wickets || 0,
        overs: (firstInnings?.oversCompleted ?? "").toString(),
        batting: isInProgress && matchData?.currentInnings === INNINGS.FIRST,
      },
      teamB: {
        name:
          teamsById.get(toId(secondInnings?.battingTeamId))?.name || "Team B",
        runs: secondInnings?.score || 0,
        wickets: secondInnings?.wickets || 0,
        overs: (secondInnings?.oversCompleted ?? "").toString(),
        batting: isInProgress && matchData?.currentInnings === INNINGS.SECOND,
      },
    };
  }, [
    teamsById,
    firstInnings,
    secondInnings,
    matchData?.status,
    matchData?.currentInnings,
  ]);

  const handleTabChange = useCallback((index: number) => {
    setSelectedInnings(index);
  }, []);

  const selectedInningsData = useMemo(() => {
    if (selectedInnings === 0) return firstInnings;
    return secondInnings;
  }, [selectedInnings, firstInnings, secondInnings]);

  const isSecondInningsYetToBat =
    selectedInnings === 1 && matchData?.currentInnings === INNINGS.FIRST;

  if (loading) return <LoadingOverlay />;

  if (error || !matchData) {
    return (
      <div className={PageContainer}>
        <div className="text-center text-red-500 py-8 font-semibold">
          {error || "Failed to load match data"}
        </div>
      </div>
    );
  }

  return (
    <div className={PageContainer}>
      <ScoreCard teamA={teamA} teamB={teamB} />

      {/* Task 12: Show connection status banners */}
      {isConnected && !isReconnecting && (
        <div className="m-3 animate-pulse text-orange-500 font-medium text-right">
          🔴 Live Updates Enabled
        </div>
      )}
      {isReconnecting && matchData.status === MATCH_STATUS.IN_PROGRESS && (
        <div className="m-3 flex items-center justify-end gap-2 text-yellow-600 font-medium">
          <span className="animate-spin">⟳</span>
          <span>Reconnecting… scores may be outdated</span>
          <button
            type="button"
            onClick={fetchMatch}
            className="ml-2 underline text-sm text-blue-500"
          >
            Refresh now
          </button>
        </div>
      )}

      <div className="flex justify-center mt-4">
        <TabSwitcher
          tabs={["1st Innings", "2nd Innings"]}
          ativeTab={selectedInnings}
          onChange={handleTabChange}
        />
      </div>

      <div className="rounded-md border border-gray-300 shadow-sm my-4 p-2">
        {isSecondInningsYetToBat ? (
          <div className="text-center text-gray-500 py-8 font-semibold">
            Yet to bat
          </div>
        ) : (
          <InningsDisplay
            balls={selectedInningsData?.balls ?? []}
            totalOvers={matchData.overs}
          />
        )}
      </div>
    </div>
  );
}
