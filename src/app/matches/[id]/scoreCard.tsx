import { formatOversCompleted } from "@/app/utils/formatOversCompleted";
import type { TeamScoreProps } from "@/components/TeamScore";

export interface ScoreCardProps {
  teamA: TeamScoreProps;
  teamB: TeamScoreProps;
  status: "in-progress" | "completed";
  totalOvers: number;
}

export const ScoreCard = ({
  teamA,
  teamB,
  status,
  totalOvers,
}: ScoreCardProps) => {
  const isLive = status === "in-progress";

  // Chase calculations — only when teamB is batting (2nd innings live)
  let runsToWin: number | null = null;
  let ballsLeft: number | null = null;
  let reqRate: number | null = null;

  if (isLive && teamB.batting) {
    const target = teamA.runs + 1;
    runsToWin = target - teamB.runs;
    const [overs, balls] = (teamB.overs || "0.0").split(".").map(Number);
    const ballsBowled = overs * 6 + (balls || 0);
    ballsLeft = totalOvers * 6 - ballsBowled;
    reqRate = ballsLeft > 0 ? (runsToWin / ballsLeft) * 6 : 0;
  }

  const matchTitle = `${teamA.name} vs ${teamB.name}`;
  const statusLabel = isLive
    ? `In Progress · ${teamB.batting ? "2nd Inn" : "1st Inn"}`
    : "Final";

  const teamAOvers = teamA.overs
    ? `${formatOversCompleted(teamA.overs)} overs`
    : "—";
  const teamBOvers = teamB.overs
    ? `${formatOversCompleted(teamB.overs)} overs`
    : "—";

  return (
    <div className="sb">
      {/* Red top bar */}
      <div className="sb-topbar">
        <span className="sb-title">{matchTitle}</span>
        <span className="sb-status">
          {isLive && <span className="sb-live-dot" />}
          {statusLabel}
        </span>
      </div>

      {/* Two-team layout */}
      <div className="sb-body">
        {/* Team A — first innings */}
        <div className="sb-team">
          <div className="sb-team-name">
            {teamA.batting && <span className="sb-bat-tag">Batting</span>}
            {teamA.name}
          </div>
          <div className={`sb-runs${teamA.batting ? " live" : ""}`}>
            {teamA.runs}
            <span className="sb-wkts">/{teamA.wickets}</span>
          </div>
          <div className="sb-overs">{teamAOvers}</div>
        </div>

        <div className="sb-vs">VS</div>

        {/* Team B — second innings */}
        <div className="sb-team right">
          <div className="sb-team-name">
            {teamB.batting && <span className="sb-bat-tag">Batting</span>}
            {teamB.name}
          </div>
          <div className={`sb-runs${teamB.batting ? " live" : ""}`}>
            {teamB.runs}
            <span className="sb-wkts">/{teamB.wickets}</span>
          </div>
          <div className="sb-overs">{teamBOvers}</div>
        </div>
      </div>

      {/* Chase stats — only for live 2nd innings */}
      {isLive &&
        teamB.batting &&
        runsToWin !== null &&
        ballsLeft !== null &&
        reqRate !== null && (
          <div className="sb-stats">
            <div className="sb-stat">
              <div className="sb-stat-val danger">{runsToWin}</div>
              <div className="sb-stat-lbl">Runs to Win</div>
            </div>
            <div className="sb-stat">
              <div className="sb-stat-val">{ballsLeft}</div>
              <div className="sb-stat-lbl">Balls Left</div>
            </div>
            <div className="sb-stat">
              <div className="sb-stat-val danger">{reqRate.toFixed(1)}</div>
              <div className="sb-stat-lbl">Req. Rate</div>
            </div>
          </div>
        )}
    </div>
  );
};
