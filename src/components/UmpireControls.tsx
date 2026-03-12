import React from "react";
import { formatOversCompleted } from "@/app/utils/formatOversCompleted";
import Modal from "./Modal";

export interface TeamScoreBoardProps {
  name: string;
  runs: number;
  wickets: number;
  overs: string;
  target?: string;
}

const TeamScoreBoard = ({
  name,
  runs,
  wickets,
  overs,
  target,
}: TeamScoreBoardProps) => (
  <div className="ump-score-bar">
    <div className="ump-score-top">
      <span className="ump-score-team">{name}</span>
      <span className="ump-score-label">Batting 🏏</span>
    </div>
    <div className="ump-score-body">
      <div className="ump-score-runs">
        {runs}
        <span className="uw">/{wickets}</span>
      </div>
      <div className="ump-score-overs">
        <div>{formatOversCompleted(overs)} overs</div>
      </div>
    </div>
    {target && <div className="ump-target-bar">{target}</div>}
  </div>
);

export interface TrackScoreProps {
  ballRuns: number;
  isExtra?: boolean;
  extraType?: string;
  isWicket?: boolean;
}

export interface UmpireControlsProps extends TeamScoreBoardProps {
  trackScore: (score: TrackScoreProps) => void;
  deletePreviousBall: () => void;
}

export const UmpireControls = ({
  name,
  runs,
  wickets,
  overs,
  target,
  trackScore,
  deletePreviousBall,
}: UmpireControlsProps) => {
  const runButtons = [0, 1, 2, 3, 4, 6];
  const runOutRuns = [0, 1, 2, 3];
  const [noBallPopup, setNoBallPopup] = React.useState(false);
  const [runOutPopup, setRunOutPopup] = React.useState(false);

  return (
    <div>
      <TeamScoreBoard
        name={name}
        runs={runs}
        wickets={wickets}
        overs={overs}
        target={target}
      />

      {/* Run-out popup */}
      {runOutPopup && (
        <Modal isOpen={true} title="Run Out — select runs">
          <div className="flex flex-col gap-5 items-center">
            <p className="text-sm" style={{ color: "var(--espn-muted)" }}>
              Runs scored before the run out
            </p>
            <div className="ump-run-grid w-full">
              {runOutRuns.map((run) => (
                <button
                  type="button"
                  key={`runout-run-${run}`}
                  className="ump-run-btn"
                  onClick={() => {
                    trackScore({ ballRuns: run, isWicket: true });
                    setRunOutPopup(false);
                  }}
                >
                  {run}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="ump-delete-btn"
              onClick={() => setRunOutPopup(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* No-ball popup */}
      {noBallPopup && (
        <Modal isOpen={true} title="No-ball — select runs">
          <div className="flex flex-col gap-5 items-center">
            <p className="text-sm" style={{ color: "var(--espn-muted)" }}>
              Runs scored off the bat on this no-ball
            </p>
            <div className="ump-run-grid w-full">
              {runButtons.map((run) => (
                <button
                  type="button"
                  key={`noball-run-${run}`}
                  className={`ump-run-btn${run === 4 ? " four" : run === 6 ? " six" : ""}`}
                  onClick={() => {
                    trackScore({
                      ballRuns: run + 1,
                      isExtra: true,
                      extraType: "noball",
                    });
                    setNoBallPopup(false);
                  }}
                >
                  {run}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="ump-delete-btn"
              onClick={() => {
                trackScore({
                  ballRuns: 1,
                  isExtra: true,
                  extraType: "noball",
                  isWicket: true,
                });
                setNoBallPopup(false);
              }}
            >
              Run Out
            </button>
          </div>
        </Modal>
      )}

      <div className="ump-controls">
        {/* Runs */}
        <div className="ump-section">
          <div className="ump-section-label">Runs</div>
          <div className="ump-run-grid">
            {runButtons.map((run) => (
              <button
                type="button"
                key={`run-${run}`}
                className={`ump-run-btn${run === 4 ? " four" : run === 6 ? " six" : ""}`}
                onClick={() => trackScore({ ballRuns: run })}
              >
                {run}
              </button>
            ))}
          </div>
        </div>

        {/* Extras */}
        <div className="ump-section">
          <div className="ump-section-label">Extras</div>
          <div className="ump-extra-grid">
            <button
              type="button"
              className="ump-extra-btn"
              onClick={() =>
                trackScore({ ballRuns: 1, isExtra: true, extraType: "wide" })
              }
            >
              Wide
            </button>
            <button
              type="button"
              className="ump-extra-btn"
              onClick={() => setNoBallPopup(true)}
            >
              No Ball
            </button>
          </div>
        </div>

        {/* Wicket */}
        <div className="ump-section">
          <div className="ump-section-label">Wicket</div>
          <div className="ump-extra-grid">
            <button
              type="button"
              className="ump-wicket-btn"
              onClick={() => trackScore({ ballRuns: 0, isWicket: true })}
            >
              Wicket
            </button>
            <button
              type="button"
              className="ump-wicket-btn"
              onClick={() => setRunOutPopup(true)}
            >
              Run Out
            </button>
          </div>
        </div>
      </div>

      {/* Delete */}
      <div className="ump-delete-section">
        <button
          type="button"
          className="ump-delete-btn"
          onClick={deletePreviousBall}
        >
          ← Delete Previous Ball
        </button>
      </div>
    </div>
  );
};

export default UmpireControls;
