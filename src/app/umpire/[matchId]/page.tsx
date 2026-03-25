"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { calculateBallsRemaining } from "@/app/utils/calculateBallsRemaining";
import { calculateNextBall } from "@/app/utils/calculateNextBall";
import LoadingOverlay from "@/components/LoadingOverlay";
import Modal from "@/components/Modal";
import {
  type TrackScoreProps,
  UmpireControls,
} from "@/components/UmpireControls";
import { INNINGS, MATCH_STATUS } from "@/constants/match";
import { useMatchData } from "@/hooks/useMatchData";
import { matchApi } from "@/services/matchApi";
import {
  getInningsCompletionStatus,
  hasSecondInningsWon,
} from "@/utils/inningsHelpers";
import { showToast } from "@/utils/toast";

export default function UmpireScorePage() {
  const { matchId } = useParams();

  // Custom hook for match data
  const {
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
  } = useMatchData(matchId);

  const { runs, wickets, oversCompleted } = scoreState;

  // Local state for UI
  const [showInningsCompletePopup, setShowInningsCompletePopup] =
    useState(false);

  // Ref to prevent duplicate transition calls
  const isTransitioningRef = useRef(false);

  // Transition innings
  const transitionInnings = useCallback(
    async (shouldFetchMatch: boolean) => {
      if (isTransitioningRef.current || !matchId) return;

      isTransitioningRef.current = true;
      setLoading(true);

      try {
        await matchApi.transitionInnings(matchId);

        if (shouldFetchMatch) {
          await fetchMatchData();
        }

        setShowInningsCompletePopup(false);
      } catch (error) {
        console.error("Failed to transition innings:", error);
        showToast("Error transitioning innings", "error");
      } finally {
        setLoading(false);
        isTransitioningRef.current = false;
      }
    },
    [matchId, fetchMatchData, setLoading],
  );

  // Track score with optimistic updates
  const trackScore = useCallback(
    async ({
      ballRuns = 0,
      isExtra = false,
      extraType = "none",
      isWicket = false,
    }: TrackScoreProps) => {
      if (!inningsData?._id || !matchId) {
        showToast("Innings data not available", "error");
        return;
      }

      const { overNumber, ballNumber } = calculateNextBall(lastBallSaved);

      const body = {
        inningsId: String(inningsData._id),
        overNumber,
        ballNumber,
        runs: ballRuns,
        isWicket,
        isExtra,
        extraType,
        matchId,
      };

      // Store previous state for rollback
      const previousState = { ...scoreState };

      // Optimistically update UI
      setScoreState((prev) => ({
        runs: prev.runs + ballRuns,
        wickets: isWicket ? prev.wickets + 1 : prev.wickets,
        oversCompleted: isExtra
          ? prev.oversCompleted
          : `${overNumber}.${ballNumber}`,
      }));

      try {
        const data = await matchApi.trackBall(body);
        setLastBallSaved(data.ball);
        showToast("Saved 👍", "success");
      } catch (error) {
        console.error("Error tracking score:", error);
        showToast("Score update failed", "error");

        // Revert optimistic updates on error
        setScoreState(previousState);
      }
    },
    [
      inningsData,
      lastBallSaved,
      matchId,
      scoreState,
      setScoreState,
      setLastBallSaved,
    ],
  );

  // Delete previous ball
  const deletePreviousBall = useCallback(async () => {
    if (!lastBallSaved) {
      showToast("No ball to delete", "error");
      return;
    }

    setLoading(true);

    try {
      await matchApi.deleteBall(String(lastBallSaved._id), String(matchId));
      showToast("Last ball deleted!", "success");
      await fetchMatchData();
    } catch (error) {
      console.error("Failed to delete last ball:", error);
      showToast("Error deleting last ball", "error");
    } finally {
      setLoading(false);
    }
  }, [lastBallSaved, fetchMatchData, setLoading, matchId]);

  // Get target text for display
  const getTargetText = useCallback((): string => {
    if (!match) return "";

    const ballsLeft = calculateBallsRemaining(match.overs ?? 0, oversCompleted);

    // First innings - show remaining balls
    if (
      match.currentInnings !== INNINGS.SECOND ||
      !match.innings ||
      match.innings[0]?.score === undefined
    ) {
      return `Remaining balls: ${ballsLeft}`;
    }

    // Second innings - show target
    const firstInningsScore = match.innings?.[0]?.score ?? 0;
    const target = firstInningsScore + 1;
    const runsNeeded = target - runs;

    if (runsNeeded <= 0) {
      return "Target Achieved!";
    }

    return `Needs ${runsNeeded} run${runsNeeded > 1 ? "s" : ""} in ${ballsLeft} ball${ballsLeft !== 1 ? "s" : ""}`;
  }, [match, runs, oversCompleted]);

  // Check innings completion
  const checkInningsCompletion = useCallback(() => {
    if (!match || !teamDetails || loading || isTransitioningRef.current) return;

    const { isAllOut, isOversCompleted } = getInningsCompletionStatus(
      teamDetails.numberOfPlayers,
      wickets,
      match.overs ?? 0,
      oversCompleted,
    );

    // First innings - show popup
    if (
      match.currentInnings === INNINGS.FIRST &&
      (isAllOut || isOversCompleted)
    ) {
      setShowInningsCompletePopup(true);
      return;
    }

    // Second innings - auto transition
    if (
      match.status === MATCH_STATUS.IN_PROGRESS &&
      match.currentInnings === INNINGS.SECOND
    ) {
      const firstInningsScore = match.innings?.[0]?.score;
      const hasWon = hasSecondInningsWon(firstInningsScore, runs);

      if (isAllOut || isOversCompleted || hasWon) {
        setTimeout(() => {
          transitionInnings(true);
        }, 1000);
      }
    }
  }, [
    match,
    teamDetails,
    wickets,
    oversCompleted,
    runs,
    loading,
    transitionInnings,
  ]);

  // Initial fetch
  useEffect(() => {
    if (!matchId) return;
    fetchMatchData();
  }, [matchId, fetchMatchData]);

  // Check completion on state changes
  useEffect(() => {
    checkInningsCompletion();
  }, [checkInningsCompletion]);

  // Persist match config to localStorage whenever a completed match is viewed
  // so "Play Again" pre-fills the form even for matches not started from this session
  useEffect(() => {
    if (match?.status !== MATCH_STATUS.COMPLETED) return;
    const teamA = match.teams.find((t) => t.battingOrder === "1st");
    const teamB = match.teams.find((t) => t.battingOrder === "2nd");
    if (!teamA || !teamB) return;
    const config = {
      location: match.location,
      teamAName: teamA.name,
      teamBName: teamB.name,
      noOfPlayers: teamA.numberOfPlayers,
      totalOvers: match.overs,
    };
    localStorage.setItem("gully_last_match_config", JSON.stringify(config));
  }, [match]);

  // Match completed view
  if (match?.status === MATCH_STATUS.COMPLETED && match?.winnerMessage) {
    return (
      <Modal isOpen={true} title="Match Complete">
        <div className="flex flex-col gap-5">
          <p
            style={{
              fontFamily: "var(--font-cond), sans-serif",
              fontSize: 15,
              color: "var(--espn-text2)",
            }}
          >
            🏆 {match.winnerMessage}
          </p>
          <Link href="/umpire" className="form-submit">
            Play Again
          </Link>
          <Link href="/" className="ump-delete-btn">
            Back to Matches
          </Link>
        </div>
      </Modal>
    );
  }

  // Innings complete popup
  if (showInningsCompletePopup) {
    return (
      <Modal isOpen={true} title="Innings Complete">
        {loading && <LoadingOverlay />}
        <div className="flex flex-col gap-5 items-center">
          <p
            style={{
              fontFamily: "var(--font-cond), sans-serif",
              fontSize: 13,
              color: "var(--espn-muted)",
            }}
          >
            All players out / Overs completed
          </p>
          <p
            style={{
              fontFamily: "var(--font-head), sans-serif",
              fontSize: 24,
              color: "var(--espn-text)",
            }}
          >
            {teamDetails?.name} — {runs} runs
          </p>
          <button
            type="button"
            onClick={() => transitionInnings(true)}
            className="form-submit"
            disabled={loading}
          >
            Start 2nd Innings
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-5">
      {loading && <LoadingOverlay />}
      {matchId && match && (
        <UmpireControls
          trackScore={trackScore}
          name={teamDetails?.name || ""}
          runs={runs}
          wickets={wickets}
          overs={oversCompleted}
          target={getTargetText()}
          deletePreviousBall={deletePreviousBall}
        />
      )}
    </div>
  );
}
