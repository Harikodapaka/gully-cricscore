"use client";

import { useCallback, useEffect, useState } from "react";
import type { MatchDTO, TeamDTO } from "@/types/dto";

export interface PlayerState {
  strikerIndex: number;
  nonStrikerIndex: number;
  bowlerIndex: number;
  nextBatsmanIndex: number;
  outPlayerIndexes: number[];
}

const STORAGE_KEY_PREFIX = "gully_player_state_";

function getStorageKey(matchId: string, inningsNumber: number): string {
  return `${STORAGE_KEY_PREFIX}${matchId}_${inningsNumber}`;
}

function savePlayerState(
  matchId: string,
  inningsNumber: number,
  state: PlayerState,
): void {
  try {
    localStorage.setItem(
      getStorageKey(matchId, inningsNumber),
      JSON.stringify(state),
    );
  } catch {
    // localStorage not available
  }
}

function loadPlayerState(
  matchId: string,
  inningsNumber: number,
): PlayerState | null {
  try {
    const stored = localStorage.getItem(getStorageKey(matchId, inningsNumber));
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Find the first player index that is not out and not currently batting.
 */
function findNextAvailableBatsman(
  totalPlayers: number,
  strikerIndex: number,
  nonStrikerIndex: number,
  outPlayerIndexes: number[],
): number {
  for (let i = 0; i < totalPlayers; i++) {
    if (i === strikerIndex || i === nonStrikerIndex) continue;
    if (outPlayerIndexes.includes(i)) continue;
    return i;
  }
  return -1; // no one available (all out)
}

export interface UsePlayerTrackingReturn {
  playerState: PlayerState;
  nextAvailableBatsman: number;
  battingTeam: TeamDTO | undefined;
  bowlingTeam: TeamDTO | undefined;
  strikerName: string;
  nonStrikerName: string;
  bowlerName: string;
  swapBatsmen: () => void;
  setBowler: (index: number) => void;
  handleWicketOut: (outIsStriker: boolean) => void;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
}

export function usePlayerTracking(
  match: MatchDTO | undefined,
  matchId: string | string[] | undefined,
): UsePlayerTrackingReturn {
  const [playerState, setPlayerState] = useState<PlayerState>({
    strikerIndex: 0,
    nonStrikerIndex: 1,
    bowlerIndex: 0,
    nextBatsmanIndex: 2,
    outPlayerIndexes: [],
  });

  const inningsNumber = match?.currentInnings ?? 1;
  const currentInningsIndex = inningsNumber - 1;
  const currentInnings = match?.innings?.[currentInningsIndex];

  const battingTeam = match?.teams.find(
    (t) => t._id === currentInnings?.battingTeamId,
  );
  const bowlingTeam = match?.teams.find(
    (t) => t._id === currentInnings?.bowlingTeamId,
  );

  // Load state from localStorage on mount or innings change
  useEffect(() => {
    if (!matchId || !match) return;

    const mId = Array.isArray(matchId) ? matchId[0] : matchId;
    const saved = loadPlayerState(mId, inningsNumber);
    if (saved) {
      // Backfill outPlayerIndexes for legacy saved states
      setPlayerState({
        ...saved,
        outPlayerIndexes: saved.outPlayerIndexes ?? [],
      });
    } else {
      // Default: Player 1 & 2 batting, Player 1 bowling
      setPlayerState({
        strikerIndex: 0,
        nonStrikerIndex: 1,
        bowlerIndex: 0,
        nextBatsmanIndex: 2,
        outPlayerIndexes: [],
      });
    }
  }, [matchId, match, inningsNumber]);

  // Persist state changes
  useEffect(() => {
    if (!matchId) return;
    const mId = Array.isArray(matchId) ? matchId[0] : matchId;
    savePlayerState(mId, inningsNumber, playerState);
  }, [matchId, inningsNumber, playerState]);

  const getName = useCallback(
    (team: TeamDTO | undefined, index: number): string => {
      if (!team) return `Player ${index + 1}`;
      return team.players?.[index] ?? `Player ${index + 1}`;
    },
    [],
  );

  const totalPlayers = battingTeam?.numberOfPlayers ?? 0;

  const strikerName = getName(battingTeam, playerState.strikerIndex);
  const nonStrikerName = getName(battingTeam, playerState.nonStrikerIndex);
  const bowlerName = getName(bowlingTeam, playerState.bowlerIndex);

  const nextAvailableBatsman = findNextAvailableBatsman(
    totalPlayers,
    playerState.strikerIndex,
    playerState.nonStrikerIndex,
    playerState.outPlayerIndexes,
  );

  const swapBatsmen = useCallback(() => {
    setPlayerState((prev) => ({
      ...prev,
      strikerIndex: prev.nonStrikerIndex,
      nonStrikerIndex: prev.strikerIndex,
    }));
  }, []);

  const setBowler = useCallback((index: number) => {
    setPlayerState((prev) => ({
      ...prev,
      bowlerIndex: index,
    }));
  }, []);

  const handleWicketOut = useCallback(
    (outIsStriker: boolean) => {
      setPlayerState((prev) => {
        const outIndex = outIsStriker
          ? prev.strikerIndex
          : prev.nonStrikerIndex;
        const newBatsman = findNextAvailableBatsman(
          totalPlayers,
          prev.strikerIndex,
          prev.nonStrikerIndex,
          [...prev.outPlayerIndexes, outIndex],
        );
        const next = {
          ...prev,
          outPlayerIndexes: [...prev.outPlayerIndexes, outIndex],
        };
        if (newBatsman !== -1) {
          if (outIsStriker) {
            next.strikerIndex = newBatsman;
          } else {
            next.nonStrikerIndex = newBatsman;
          }
        }
        return next;
      });
    },
    [totalPlayers],
  );

  return {
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
  };
}
