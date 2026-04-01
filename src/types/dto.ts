// DTO (Data Transfer Object) types for API responses.
// All _id fields are serialised as strings at the API boundary,
// eliminating the need for String() casts scattered throughout the codebase.

export interface TeamDTO {
  _id: string;
  name: string;
  numberOfPlayers: number;
  battingOrder: "1st" | "2nd";
  players: string[];
}

export interface BallDTO {
  _id: string;
  inningsId: string;
  overNumber: number;
  ballNumber: number;
  runs: number;
  isWicket: boolean;
  isExtra: boolean;
  extraType: "none" | "wide" | "noball";
  batsmanName?: string;
  bowlerName?: string;
  timestamp: string;
}

export interface InningsDTO {
  _id: string;
  inningsNumber: 1 | 2;
  battingTeamId: string;
  bowlingTeamId: string;
  score: number;
  wickets: number;
  oversCompleted: string;
  status: "in-progress" | "completed";
  startedAt: string;
  completedAt?: string;
  balls?: BallDTO[];
}

export interface MatchDTO {
  _id: string;
  location: string;
  overs: number;
  status: "in-progress" | "completed";
  currentInnings: 1 | 2;
  createdAt: string;
  completedAt?: string;
  teams: TeamDTO[];
  innings: InningsDTO[];
  wonBy?: string;
  winnerMessage?: string;
}
