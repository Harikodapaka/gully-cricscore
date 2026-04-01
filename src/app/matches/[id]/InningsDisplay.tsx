import type { BallDTO } from "@/types/dto";
import { BallDisplay } from "./ballDisplay";
import { Divider } from "./divider";

interface InningsDisplayProps {
  balls: BallDTO[];
  totalOvers: number;
}

export function InningsDisplay({ balls, totalOvers }: InningsDisplayProps) {
  if (!balls?.length) {
    return (
      <div className="ytb">
        <div className="ytb-ico">🏏</div>
        <div className="ytb-h">Innings In Progress</div>
        <div className="ytb-p">Ball-by-ball updates will appear here</div>
      </div>
    );
  }

  return (
    <>
      {Array.from({ length: totalOvers }, (_, overIdx) => overIdx)
        .reverse()
        .map((overIdx) => {
          const ballsForOver = balls.filter(
            (ball) => ball.overNumber === overIdx,
          );
          if (ballsForOver.length === 0) return null;

          const overRuns = ballsForOver.reduce(
            (sum, b) => sum + (b.runs || 0),
            0,
          );
          const overWickets = ballsForOver.filter((b) => b.isWicket).length;
          // Bowler name from the first ball of the over (all balls in an over share the same bowler)
          const bowlerName = ballsForOver.find((b) => b.bowlerName)?.bowlerName;

          return (
            <div key={`over-${overIdx + 1}`} className="over-group">
              <Divider
                over={overIdx + 1}
                runs={overRuns}
                wickets={overWickets}
                bowlerName={bowlerName}
              />
              {ballsForOver.map((ball, i) => (
                <BallDisplay
                  key={`ball-${overIdx + 1}-${i}`}
                  ballNumber={ball.ballNumber}
                  runs={ball.runs}
                  isWicket={ball.isWicket}
                  extraType={ball.extraType}
                  overNumber={ball.overNumber}
                  batsmanName={ball.batsmanName}
                />
              ))}
            </div>
          );
        })}
    </>
  );
}
