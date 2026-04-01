"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { calculateBallsRemaining } from "@/app/utils/calculateBallsRemaining";
import {
  BALLS_PER_OVER,
  calculateNextBall,
} from "@/app/utils/calculateNextBall";
import LoadingOverlay from "@/components/LoadingOverlay";
import Modal from "@/components/Modal";
import {
  type TrackScoreProps,
  UmpireControls,
} from "@/components/UmpireControls";
import { INNINGS, MATCH_STATUS } from "@/constants/match";
import { useMatchData } from "@/hooks/useMatchData";
import { usePlayerTracking } from "@/hooks/usePlayerTracking";
import { matchApi } from "@/services/matchApi";
import {
  getInningsCompletionStatus,
  hasSecondInningsWon,
} from "@/utils/inningsHelpers";
import { showToast } from "@/utils/toast";

export default function UmpireScorePage() {
  const { matchId } = useParams();

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

  const {
    playerState,
    nextAvailableBatsman,
    battingTeam,
    bowlingTeam,
    strikerName,
    nonStrikerName,
    bowlerName,
    swapBatsmen,
    setBowler,
    handleWicketOut,
    setPlayerState,
  } = usePlayerTracking(match, matchId);

  // UI state
  const [showInningsCompletePopup, setShowInningsCompletePopup] =
    useState(false);
  const [showPlayerNamePopup, setShowPlayerNamePopup] = useState<{
    teamId: string;
    playerIndex: number;
    currentName: string;
  } | null>(null);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [showWicketSelectPopup, setShowWicketSelectPopup] = useState<{
    score: TrackScoreProps;
  } | null>(null);
  const [showBowlerSelectPopup, setShowBowlerSelectPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [settingsOvers, setSettingsOvers] = useState(0);
  const [settingsPlayers, setSettingsPlayers] = useState(0);
  const [showChangePlayerPopup, setShowChangePlayerPopup] = useState<
    "striker" | "nonStriker" | null
  >(null);

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
        setShowBowlerSelectPopup(false);
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
        batsmanName: strikerName,
        bowlerName: bowlerName,
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
        showToast("Saved", "success");

        const isLastMan =
          scoreState.wickets + (isWicket ? 1 : 0) >=
          (battingTeam?.numberOfPlayers ?? 0) - 1;

        // Swap batsmen on odd bat-runs (1, 3) — skip if last man standing
        // Wides: no bat runs (penalty only), no swap
        // No-balls: bat runs = ballRuns - 1 (1 is the penalty)
        // Normal: bat runs = ballRuns
        let batRuns = ballRuns;
        if (isExtra && extraType === "wide") batRuns = 0;
        else if (isExtra && extraType === "noball") batRuns = ballRuns - 1;

        if (!isLastMan && !isWicket && batRuns % 2 === 1) {
          swapBatsmen();
        }

        // Check if over is complete (6th legal ball, not an extra)
        if (!isExtra && ballNumber === BALLS_PER_OVER) {
          // Swap batsmen at end of over — skip if last man standing
          if (!isLastMan) {
            swapBatsmen();
          }
          // Show bowler selection popup
          setShowBowlerSelectPopup(true);
        }
      } catch (error) {
        console.error("Error tracking score:", error);
        showToast("Score update failed", "error");
        setScoreState(previousState);
      }
    },
    [
      inningsData,
      lastBallSaved,
      matchId,
      scoreState,
      strikerName,
      bowlerName,
      setScoreState,
      setLastBallSaved,
      swapBatsmen,
      battingTeam,
    ],
  );

  // Process wicket: record the ball and auto-assign next available batsman
  const processWicketWithAutoNext = useCallback(
    async (score: TrackScoreProps, outIsStriker: boolean) => {
      await trackScore(score);
      handleWicketOut(outIsStriker);
    },
    [trackScore, handleWicketOut],
  );

  // Handle wicket - determine if we need to ask who is out
  const handleWicketWithPlayerSelect = useCallback(
    (score: TrackScoreProps) => {
      const totalPlayers = battingTeam?.numberOfPlayers ?? 0;
      const currentWickets = wickets; // wickets already fallen
      const isLastWicket = currentWickets + 1 >= totalPlayers - 1;

      if (isLastWicket && !score.isRunOut) {
        // Last wicket (not run out) — striker is out, no new batsman needed
        trackScore(score);
        setPlayerState((prev) => ({
          ...prev,
          outPlayerIndexes: [...prev.outPlayerIndexes, prev.strikerIndex],
          strikerIndex: prev.nonStrikerIndex,
        }));
        return;
      }

      // Run outs — always show popup to ask who is out (either batsman could be out)
      if (score.isRunOut) {
        setShowWicketSelectPopup({ score });
        return;
      }

      // Regular wicket — striker is always out, auto-process
      processWicketWithAutoNext(score, true);
    },
    [
      battingTeam,
      wickets,
      trackScore,
      processWicketWithAutoNext,
      setPlayerState,
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

    if (
      match.currentInnings !== INNINGS.SECOND ||
      !match.innings ||
      match.innings[0]?.score === undefined
    ) {
      return `Remaining balls: ${ballsLeft}`;
    }

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

    if (
      match.currentInnings === INNINGS.FIRST &&
      (isAllOut || isOversCompleted)
    ) {
      setShowInningsCompletePopup(true);
      return;
    }

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

  // Player name edit handler
  const handlePlayerNameClick = useCallback(
    (teamId: string, playerIndex: number, currentName: string) => {
      setPlayerNameInput(currentName);
      setShowPlayerNamePopup({ teamId, playerIndex, currentName });
    },
    [],
  );

  const savePlayerName = useCallback(async () => {
    if (!showPlayerNamePopup || !playerNameInput.trim()) return;

    try {
      await matchApi.updateTeamPlayer(
        showPlayerNamePopup.teamId,
        showPlayerNamePopup.playerIndex,
        playerNameInput.trim(),
        matchId,
      );
      showToast("Player name updated", "success");
      await fetchMatchData();
    } catch (error) {
      console.error("Failed to update player name:", error);
      showToast("Failed to update name", "error");
    } finally {
      setShowPlayerNamePopup(null);
    }
  }, [showPlayerNamePopup, playerNameInput, fetchMatchData, matchId]);

  // Settings save handler
  const saveSettings = useCallback(async () => {
    if (!matchId) return;

    const updates: { overs?: number; numberOfPlayers?: number } = {};
    if (settingsOvers !== match?.overs) updates.overs = settingsOvers;
    if (settingsPlayers !== teamDetails?.numberOfPlayers)
      updates.numberOfPlayers = settingsPlayers;

    if (Object.keys(updates).length === 0) {
      setShowSettingsPopup(false);
      return;
    }

    try {
      await matchApi.updateMatch(matchId, updates);
      showToast("Match settings updated", "success");
      await fetchMatchData();
    } catch (error) {
      console.error("Failed to update match:", error);
      showToast("Failed to update settings", "error");
    } finally {
      setShowSettingsPopup(false);
    }
  }, [
    matchId,
    match,
    teamDetails,
    settingsOvers,
    settingsPlayers,
    fetchMatchData,
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
            {match.winnerMessage}
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

      {/* Player name edit popup */}
      {showPlayerNamePopup && (
        <Modal
          isOpen={true}
          onClose={() => setShowPlayerNamePopup(null)}
          title="Edit Player Name"
        >
          <div className="flex flex-col gap-4">
            <div className="ump-settings-field">
              <label htmlFor="playerNameInput">Player Name</label>
              <input
                id="playerNameInput"
                type="text"
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && savePlayerName()}
              />
            </div>
            <button
              type="button"
              className="form-submit"
              onClick={savePlayerName}
            >
              Save
            </button>
            <button
              type="button"
              className="ump-delete-btn"
              onClick={() => setShowPlayerNamePopup(null)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Wicket: Who is out popup */}
      {showWicketSelectPopup && (
        <Modal
          isOpen={true}
          title="Who is out?"
          onClose={() => setShowWicketSelectPopup(null)}
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "var(--espn-muted)" }}>
              Next in:{" "}
              {nextAvailableBatsman !== -1
                ? (battingTeam?.players[nextAvailableBatsman] ??
                  `Player ${nextAvailableBatsman + 1}`)
                : "No one available"}
            </p>
            <div className="ump-player-list">
              <button
                type="button"
                className="ump-player-list-btn"
                onClick={async () => {
                  const totalPlayers = battingTeam?.numberOfPlayers ?? 0;
                  const isLastWicket = wickets + 1 >= totalPlayers - 1;
                  if (isLastWicket) {
                    await trackScore(showWicketSelectPopup.score);
                    setPlayerState((prev) => ({
                      ...prev,
                      outPlayerIndexes: [
                        ...prev.outPlayerIndexes,
                        prev.strikerIndex,
                      ],
                      strikerIndex: prev.nonStrikerIndex,
                    }));
                  } else {
                    await processWicketWithAutoNext(
                      showWicketSelectPopup.score,
                      true,
                    );
                  }
                  setShowWicketSelectPopup(null);
                }}
              >
                🏏 {strikerName} (Striker)
              </button>
              <button
                type="button"
                className="ump-player-list-btn"
                onClick={async () => {
                  const totalPlayers = battingTeam?.numberOfPlayers ?? 0;
                  const isLastWicket = wickets + 1 >= totalPlayers - 1;
                  if (isLastWicket) {
                    await trackScore(showWicketSelectPopup.score);
                    setPlayerState((prev) => ({
                      ...prev,
                      outPlayerIndexes: [
                        ...prev.outPlayerIndexes,
                        prev.nonStrikerIndex,
                      ],
                    }));
                  } else {
                    await processWicketWithAutoNext(
                      showWicketSelectPopup.score,
                      false,
                    );
                  }
                  setShowWicketSelectPopup(null);
                }}
              >
                🧍 {nonStrikerName} (Non-Striker)
              </button>
            </div>
            <button
              type="button"
              className="ump-delete-btn"
              onClick={() => setShowWicketSelectPopup(null)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Bowler selection popup */}
      {showBowlerSelectPopup && (
        <Modal
          isOpen={true}
          title="Select Bowler"
          onClose={() => setShowBowlerSelectPopup(false)}
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "var(--espn-muted)" }}>
              Over complete. Select the next bowler.
            </p>
            <div className="ump-settings-field">
              <select
                value={playerState.bowlerIndex}
                onChange={(e) => {
                  setBowler(Number(e.target.value));
                  setShowBowlerSelectPopup(false);
                }}
              >
                {bowlingTeam?.players.map((playerName, index) => (
                  <option key={`bowler-${playerName}`} value={index}>
                    {playerName}
                    {index === playerState.bowlerIndex ? " (current)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="ump-delete-btn"
              onClick={() => setShowBowlerSelectPopup(false)}
            >
              Continue with same bowler
            </button>
          </div>
        </Modal>
      )}

      {/* Change Striker / Non-Striker popup */}
      {showChangePlayerPopup && battingTeam && (
        <Modal
          isOpen={true}
          onClose={() => setShowChangePlayerPopup(null)}
          title={
            showChangePlayerPopup === "striker"
              ? "Change Striker"
              : "Change Non-Striker"
          }
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "var(--espn-muted)" }}>
              {showChangePlayerPopup === "striker"
                ? "Select who will be on strike"
                : "Select the non-striker"}
            </p>
            <div className="ump-settings-field">
              <select
                value={
                  showChangePlayerPopup === "striker"
                    ? playerState.strikerIndex
                    : playerState.nonStrikerIndex
                }
                onChange={(e) => {
                  const index = Number(e.target.value);
                  setPlayerState((prev) => ({
                    ...prev,
                    [showChangePlayerPopup === "striker"
                      ? "strikerIndex"
                      : "nonStrikerIndex"]: index,
                  }));
                  setShowChangePlayerPopup(null);
                }}
              >
                {battingTeam.players
                  .map((name, index) => ({ name, index }))
                  .filter(({ index }) => {
                    if (playerState.outPlayerIndexes?.includes(index))
                      return false;
                    if (
                      showChangePlayerPopup === "striker" &&
                      index === playerState.nonStrikerIndex
                    )
                      return false;
                    if (
                      showChangePlayerPopup === "nonStriker" &&
                      index === playerState.strikerIndex
                    )
                      return false;
                    return true;
                  })
                  .map(({ name, index }) => {
                    const isCurrent =
                      (showChangePlayerPopup === "striker" &&
                        index === playerState.strikerIndex) ||
                      (showChangePlayerPopup === "nonStriker" &&
                        index === playerState.nonStrikerIndex);
                    return (
                      <option key={`change-player-${index}`} value={index}>
                        {name}
                        {isCurrent ? " (current)" : ""}
                      </option>
                    );
                  })}
              </select>
            </div>
            <button
              type="button"
              className="ump-delete-btn"
              onClick={() => setShowChangePlayerPopup(null)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Match settings popup */}
      {showSettingsPopup && (
        <Modal
          isOpen={true}
          onClose={() => setShowSettingsPopup(false)}
          title="Match Settings"
        >
          <div className="ump-settings-form">
            <div className="ump-settings-field">
              <label htmlFor="settingsOvers">Total Overs (max 50)</label>
              <input
                id="settingsOvers"
                type="number"
                min={1}
                max={50}
                value={settingsOvers}
                onChange={(e) => setSettingsOvers(Number(e.target.value))}
              />
            </div>
            <div className="ump-settings-field">
              <label htmlFor="settingsPlayers">Players Per Team (max 11)</label>
              <input
                id="settingsPlayers"
                type="number"
                min={2}
                max={11}
                value={settingsPlayers}
                onChange={(e) => setSettingsPlayers(Number(e.target.value))}
              />
            </div>
            <button
              type="button"
              className="form-submit"
              onClick={saveSettings}
            >
              Save Changes
            </button>
            <button
              type="button"
              className="ump-delete-btn"
              onClick={() => setShowSettingsPopup(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {matchId && match && (
        <UmpireControls
          trackScore={trackScore}
          name={teamDetails?.name || ""}
          runs={runs}
          wickets={wickets}
          overs={oversCompleted}
          target={getTargetText()}
          deletePreviousBall={deletePreviousBall}
          playerInfo={{
            strikerName,
            nonStrikerName,
            bowlerName,
            battingTeam,
            bowlingTeam,
            strikerIndex: playerState.strikerIndex,
            nonStrikerIndex: playerState.nonStrikerIndex,
            bowlerIndex: playerState.bowlerIndex,
            nextBatsmanIndex: playerState.nextBatsmanIndex,
          }}
          onPlayerNameClick={handlePlayerNameClick}
          onWicketWithPlayerSelect={handleWicketWithPlayerSelect}
          onSwapBatsmen={swapBatsmen}
          onChangeBowler={() => setShowBowlerSelectPopup(true)}
          onChangeStriker={
            match.currentInnings === 2
              ? () => setShowChangePlayerPopup("striker")
              : undefined
          }
          onChangeNonStriker={
            match.currentInnings === 2
              ? () => setShowChangePlayerPopup("nonStriker")
              : undefined
          }
          onSettingsClick={
            match.currentInnings === 1
              ? () => {
                  setSettingsOvers(match.overs);
                  setSettingsPlayers(teamDetails?.numberOfPlayers ?? 11);
                  setShowSettingsPopup(true);
                }
              : undefined
          }
          onOverComplete={() => setShowBowlerSelectPopup(true)}
          totalOvers={match.overs}
        />
      )}
    </div>
  );
}
