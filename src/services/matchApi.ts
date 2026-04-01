import { API_BASE_URL } from "@/constants/match";
import type { BallDTO, MatchDTO } from "@/types/dto";

export interface BallPayload {
  inningsId: string;
  overNumber: number;
  ballNumber: number;
  runs: number;
  isWicket: boolean;
  isExtra: boolean;
  extraType: string;
  batsmanName?: string;
  bowlerName?: string;
  matchId: string | string[];
}

export const matchApi = {
  fetchMatchDetails: async (
    matchId: string | string[],
  ): Promise<{ data: MatchDTO }> => {
    const response = await fetch(
      `${API_BASE_URL}/api/match/${matchId}/details`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch match data");
    }
    return response.json();
  },

  transitionInnings: async (
    matchId: string | string[],
  ): Promise<{ message: string; data?: MatchDTO }> => {
    const response = await fetch(
      `${API_BASE_URL}/api/match/${matchId}/transition-innings`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!response.ok) {
      throw new Error("Failed to transition innings");
    }
    return response.json();
  },

  trackBall: async (
    body: BallPayload,
  ): Promise<{ message: string; ball: BallDTO }> => {
    const response = await fetch(`${API_BASE_URL}/api/ball`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to track score");
    }
    return response.json();
  },

  updateMatch: async (
    matchId: string | string[],
    body: { overs?: number; numberOfPlayers?: number },
  ): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/match/${matchId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to update match");
    }
    return response.json();
  },

  updateTeamPlayer: async (
    teamId: string,
    playerIndex: number,
    playerName: string,
    matchId?: string | string[],
  ): Promise<{ message: string; data: { _id: string; players: string[] } }> => {
    const response = await fetch(`${API_BASE_URL}/api/team/${teamId}`, {
      method: "PATCH",
      body: JSON.stringify({ playerIndex, playerName, matchId }),
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to update player name");
    }
    return response.json();
  },

  deleteBall: async (
    ballId: string,
    matchId: string | string[],
  ): Promise<{ message: string }> => {
    const response = await fetch(
      `${API_BASE_URL}/api/ball/${ballId}?matchId=${matchId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!response.ok) {
      throw new Error("Failed to delete last ball");
    }
    return response.json();
  },
};
