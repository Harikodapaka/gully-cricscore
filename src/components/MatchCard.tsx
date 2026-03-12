import { formatOversCompleted } from "@/app/utils/formatOversCompleted";
import type { IMatchPopulated } from "@/models/Match";
import { toId } from "@/utils/toId";

interface MatchCardProps {
  match: IMatchPopulated;
}

export default function MatchCard({ match }: MatchCardProps) {
  if (!match) return null;

  const teamNamesMap = match?.teams?.reduce(
    (acc, team) => {
      acc[String(team._id)] = team.name;
      return acc;
    },
    {} as Record<string, string>,
  );

  const teamA = {
    name: teamNamesMap[toId(match.innings?.[0]?.battingTeamId)] || "Team A",
    runs: match.innings?.[0]?.score || 0,
    wickets: match.innings?.[0]?.wickets || 0,
    oversCompleted: match.innings?.[0]?.oversCompleted || "0.0",
    batting: match.status === "in-progress" && match.currentInnings === 1,
  };

  const teamB = {
    name: teamNamesMap[toId(match.innings?.[0]?.bowlingTeamId)] || "Team B",
    runs: match.innings?.[1]?.score || 0,
    wickets: match.innings?.[1]?.wickets || 0,
    oversCompleted: match.innings?.[1]?.oversCompleted || "0.0",
    batting: match.status === "in-progress" && match.currentInnings === 2,
  };

  const isInProgress = match.status === "in-progress";
  const isSecondInnings = isInProgress && match.currentInnings === 2;
  const winner = match.wonBy ? teamNamesMap[toId(match.wonBy)] : null;
  const isTied =
    match.status === "completed" &&
    match.innings?.[1]?.score === match.innings?.[0]?.score;

  const numberOfPlayers = match.teams?.[0]?.numberOfPlayers || 0;

  // Chase calculations (2nd innings live)
  let runsNeeded: number | null = null;
  let ballsLeft: number | null = null;
  let rrr: number | null = null;

  if (isSecondInnings) {
    const target = (match.innings?.[0]?.score || 0) + 1;
    runsNeeded = target - teamB.runs;
    const [overs, balls] = (teamB.oversCompleted || "0.0")
      .split(".")
      .map(Number);
    const ballsBowled = overs * 6 + (balls || 0);
    ballsLeft = match.overs * 6 - ballsBowled;
    rrr = ballsLeft > 0 ? (runsNeeded / ballsLeft) * 6 : 0;
  }

  // Strip meta text
  const currentOvers = isInProgress
    ? formatOversCompleted(
        match.currentInnings === 2
          ? teamB.oversCompleted
          : teamA.oversCompleted,
      )
    : null;

  const stripMeta = isInProgress
    ? `${match.currentInnings === 2 ? "2nd" : "1st"} Innings · Over ${currentOvers} of ${match.overs} · ${numberOfPlayers} players aside`
    : `${match.overs} overs · ${numberOfPlayers} players aside`;

  const matchDate = new Date(match.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className={`mc-card${isInProgress ? " live" : ""}`}>
      {/* Strip */}
      <div className="mc-strip">
        <div>
          {isInProgress ? (
            <span className="mc-live-badge">
              <span className="mc-live-dot" />
              Live
            </span>
          ) : (
            <span className="mc-done-badge">Final</span>
          )}
        </div>
        <span className="mc-strip-meta">{stripMeta}</span>
      </div>

      {/* Scores */}
      <div className="mc-scores">
        {/* Team A — first innings batting side */}
        <div className="mc-score-row">
          <div className="mc-team-wrap">
            <span className="mc-bat-ico">{teamA.batting ? "🏏" : ""}</span>
            <span className={`mc-team-name${teamA.batting ? " batting" : ""}`}>
              {teamA.name}
            </span>
          </div>
          <div className="mc-runs-block">
            <span className={`mc-runs${teamA.batting ? " live" : ""}`}>
              {teamA.runs}
              <span className="mc-runs-slash">/</span>
              <span className="mc-runs-wkts">{teamA.wickets}</span>
            </span>
          </div>
          <div className="mc-overs">
            {formatOversCompleted(teamA.oversCompleted)} ov
          </div>
        </div>

        {/* Team B — second innings batting side */}
        <div className="mc-score-row">
          <div className="mc-team-wrap">
            <span className="mc-bat-ico">{teamB.batting ? "🏏" : ""}</span>
            <span className={`mc-team-name${teamB.batting ? " batting" : ""}`}>
              {teamB.name}
            </span>
          </div>
          <div className="mc-runs-block">
            <span className={`mc-runs${teamB.batting ? " live" : ""}`}>
              {teamB.runs}
              <span className="mc-runs-slash">/</span>
              <span className="mc-runs-wkts">{teamB.wickets}</span>
            </span>
          </div>
          <div className="mc-overs">
            {formatOversCompleted(teamB.oversCompleted)} ov
          </div>
        </div>

        {/* Chase bar */}
        {isSecondInnings &&
          runsNeeded !== null &&
          ballsLeft !== null &&
          rrr !== null && (
            <div className="mc-chase">
              <span className="mc-chase-txt">
                Need <strong>{runsNeeded}</strong> runs from{" "}
                <strong>{ballsLeft}</strong> balls
              </span>
              <span className="mc-rrr">RRR {rrr.toFixed(2)}</span>
            </div>
          )}

        {/* Result */}
        {!isInProgress && (
          <div className={`mc-result${isTied ? " tie" : ""}`}>
            {isTied ? (
              <>🤝 Match tied</>
            ) : (
              <>
                🏆{" "}
                {match.winnerMessage
                  ? match.winnerMessage
                  : `${winner} won the match`}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mc-foot">
        <span className="mc-chip">🗓 {matchDate}</span>
        <span className="mc-chip">📍 {match.location}</span>
        <span className="mc-chip">👥 {numberOfPlayers}-a-side</span>
      </div>
    </div>
  );
}
