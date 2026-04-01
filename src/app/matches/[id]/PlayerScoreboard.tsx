"use client";

import { useMemo, useState } from "react";
import type { BallDTO } from "@/types/dto";

interface PlayerStats {
  name: string;
  runs: number;
  ballsFaced: number;
  wicketsTaken: number;
  oversBowled: string;
}

interface PlayerScoreboardProps {
  balls: BallDTO[];
  battingTeamName: string;
  bowlingTeamName: string;
}

function computeStats(balls: BallDTO[]) {
  const batsmen = new Map<string, { runs: number; ballsFaced: number }>();
  const bowlers = new Map<string, { wickets: number; legalBalls: number }>();

  for (const ball of balls) {
    // Batting stats
    if (ball.batsmanName) {
      const prev = batsmen.get(ball.batsmanName) ?? {
        runs: 0,
        ballsFaced: 0,
      };

      // Bat runs: for wides the batsman doesn't face the ball
      const isWide = ball.isExtra && ball.extraType === "wide";
      const batRuns = isWide
        ? 0
        : ball.isExtra && ball.extraType === "noball"
          ? ball.runs - 1
          : ball.runs;

      prev.runs += batRuns;
      if (!isWide) prev.ballsFaced += 1;
      batsmen.set(ball.batsmanName, prev);
    }

    // Bowling stats
    if (ball.bowlerName) {
      const prev = bowlers.get(ball.bowlerName) ?? {
        wickets: 0,
        legalBalls: 0,
      };
      if (ball.isWicket) prev.wickets += 1;
      if (!ball.isExtra) prev.legalBalls += 1;
      bowlers.set(ball.bowlerName, prev);
    }
  }

  const battingStats: PlayerStats[] = Array.from(batsmen.entries()).map(
    ([name, s]) => ({
      name,
      runs: s.runs,
      ballsFaced: s.ballsFaced,
      wicketsTaken: 0,
      oversBowled: "",
    }),
  );

  const bowlingStats: PlayerStats[] = Array.from(bowlers.entries()).map(
    ([name, s]) => {
      const fullOvers = Math.floor(s.legalBalls / 6);
      const remainingBalls = s.legalBalls % 6;
      return {
        name,
        runs: 0,
        ballsFaced: 0,
        wicketsTaken: s.wickets,
        oversBowled: `${fullOvers}.${remainingBalls}`,
      };
    },
  );

  return { battingStats, bowlingStats };
}

export function PlayerScoreboard({
  balls,
  battingTeamName,
  bowlingTeamName,
}: PlayerScoreboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { battingStats, bowlingStats } = useMemo(
    () => computeStats(balls),
    [balls],
  );

  if (balls.length === 0) return null;

  return (
    <div className="psb-card">
      <button
        type="button"
        className="psb-header"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="psb-title">Scoreboard</span>
        <span className="psb-chevron">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="psb-body">
          {/* Batting table */}
          {battingStats.length > 0 && (
            <div className="psb-section">
              <div className="psb-section-label">
                {battingTeamName} — Batting
              </div>
              <table className="psb-table">
                <thead>
                  <tr>
                    <th className="psb-th psb-th-name">Batter</th>
                    <th className="psb-th">R</th>
                    <th className="psb-th">B</th>
                  </tr>
                </thead>
                <tbody>
                  {battingStats.map((p) => (
                    <tr key={`bat-${p.name}`} className="psb-tr">
                      <td className="psb-td psb-td-name">{p.name}</td>
                      <td className="psb-td">{p.runs}</td>
                      <td className="psb-td">{p.ballsFaced}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bowling table */}
          {bowlingStats.length > 0 && (
            <div className="psb-section">
              <div className="psb-section-label">
                {bowlingTeamName} — Bowling
              </div>
              <table className="psb-table">
                <thead>
                  <tr>
                    <th className="psb-th psb-th-name">Bowler</th>
                    <th className="psb-th">O</th>
                    <th className="psb-th">W</th>
                  </tr>
                </thead>
                <tbody>
                  {bowlingStats.map((p) => (
                    <tr key={`bowl-${p.name}`} className="psb-tr">
                      <td className="psb-td psb-td-name">{p.name}</td>
                      <td className="psb-td">{p.oversBowled}</td>
                      <td className="psb-td">{p.wicketsTaken}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
