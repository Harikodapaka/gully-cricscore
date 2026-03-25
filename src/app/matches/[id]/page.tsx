"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateOversCompleted } from "@/app/utils/calculateOversCompleted";
import LoadingOverlay from "@/components/LoadingOverlay";
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
      <div className="mx-auto max-w-[900px] px-4 py-6">
        <div
          className="text-center py-8 font-semibold"
          style={{ color: "var(--espn-red)" }}
        >
          {error || "Failed to load match data"}
        </div>
      </div>
    );
  }

  const battingTeamName = teamB.batting
    ? teamB.name
    : teamA.batting
      ? teamA.name
      : null;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-5">
      {/* Live status bar */}
      {isConnected &&
        !isReconnecting &&
        matchData.status === MATCH_STATUS.IN_PROGRESS && (
          <div className="dp-status-bar bar-live">
            <span className="dp-pulse" />
            Live Updates Active
            {battingTeamName ? ` — ${battingTeamName} Batting` : ""}
          </div>
        )}

      {/* Reconnecting banner */}
      {isReconnecting && matchData.status === MATCH_STATUS.IN_PROGRESS && (
        <div className="dp-status-bar bar-reconnect">
          <span className="dp-spin">⟳</span>
          <span>Reconnecting… scores may be outdated</span>
          <button type="button" onClick={fetchMatch}>
            Refresh now
          </button>
        </div>
      )}

      {/* Scoreboard widget */}
      <ScoreCard
        teamA={teamA}
        teamB={teamB}
        status={matchData.status}
        totalOvers={matchData.overs}
      />

      {/* Innings tabs */}
      <div className="detail-tabs">
        <button
          type="button"
          className={`detail-tab${selectedInnings === 0 ? " active" : ""}`}
          onClick={() => handleTabChange(0)}
        >
          1st Innings
        </button>
        <button
          type="button"
          className={`detail-tab${selectedInnings === 1 ? " active" : ""}`}
          onClick={() => handleTabChange(1)}
        >
          2nd Innings
        </button>
      </div>

      {/* Innings content */}
      {isSecondInningsYetToBat ? (
        <div className="ytb">
          <div className="ytb-ico">🏏</div>
          <div className="ytb-h">Yet to Bat</div>
          <div className="ytb-p">
            Ball-by-ball updates will appear here once the innings begins
          </div>
        </div>
      ) : (selectedInningsData?.balls ?? []).length === 0 ? (
        <div className="ytb">
          <div className="ytb-ico">🏏</div>
          <div className="ytb-h">Innings In Progress</div>
          <div className="ytb-p">Ball-by-ball updates will appear here</div>
        </div>
      ) : (
        <InningsDisplay
          balls={selectedInningsData?.balls ?? []}
          totalOvers={matchData.overs}
        />
      )}
    </div>
  );
}
