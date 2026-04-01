import React from "react";
import { formatOversCompleted } from "@/app/utils/formatOversCompleted";
import type { TeamDTO } from "@/types/dto";
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
      <span className="ump-score-label">Batting</span>
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
  isRunOut?: boolean;
}

export interface PlayerInfo {
  strikerName: string;
  nonStrikerName: string;
  bowlerName: string;
  battingTeam?: TeamDTO;
  bowlingTeam?: TeamDTO;
  strikerIndex: number;
  nonStrikerIndex: number;
  bowlerIndex: number;
  nextBatsmanIndex: number;
}

export interface UmpireControlsProps extends TeamScoreBoardProps {
  trackScore: (score: TrackScoreProps) => void;
  deletePreviousBall: () => void;
  playerInfo: PlayerInfo;
  onPlayerNameClick: (
    teamId: string,
    playerIndex: number,
    currentName: string,
  ) => void;
  onWicketWithPlayerSelect: (score: TrackScoreProps) => void;
  onSwapBatsmen: () => void;
  onChangeBowler: () => void;
  onSettingsClick?: () => void;
  onChangeStriker?: () => void;
  onChangeNonStriker?: () => void;
  onOverComplete: () => void;
  totalOvers: number;
}

export const UmpireControls = ({
  name,
  runs,
  wickets,
  overs,
  target,
  trackScore,
  deletePreviousBall,
  playerInfo,
  onPlayerNameClick,
  onWicketWithPlayerSelect,
  onSwapBatsmen,
  onChangeBowler,
  onSettingsClick,
  onChangeStriker,
  onChangeNonStriker,
}: UmpireControlsProps) => {
  const runButtons = [0, 1, 2, 3, 4, 6];
  const runOutRuns = [0, 1, 2, 3];
  const [noBallPopup, setNoBallPopup] = React.useState(false);
  const [runOutPopup, setRunOutPopup] = React.useState(false);

  // In gully cricket, even a single player can bat (last man standing)
  const totalPlayers = playerInfo.battingTeam?.numberOfPlayers ?? 0;
  const isLastManStanding = wickets >= totalPlayers - 1;

  const handleTrackScore = (score: TrackScoreProps) => {
    trackScore(score);
  };

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
        <Modal
          isOpen={true}
          title="Run Out — select runs"
          onClose={() => setRunOutPopup(false)}
        >
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
                    onWicketWithPlayerSelect({
                      ballRuns: run,
                      isWicket: true,
                      isRunOut: true,
                    });
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
        <Modal
          isOpen={true}
          title="No-ball — select runs"
          onClose={() => setNoBallPopup(false)}
        >
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
                    handleTrackScore({
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
                onWicketWithPlayerSelect({
                  ballRuns: 1,
                  isExtra: true,
                  extraType: "noball",
                  isWicket: true,
                  isRunOut: true,
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
        {/* On-field players */}
        <div className="ump-section">
          <div className="ump-section-label">On Field</div>

          {/* Row 1: Striker & Non-Striker (hide non-striker when last man) */}
          <div className="ump-player-row">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                flex: 1,
                minWidth: 0,
              }}
            >
              {onChangeStriker && (
                <button
                  type="button"
                  className="ump-change-btn"
                  onClick={onChangeStriker}
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    alignSelf: "flex-start",
                  }}
                >
                  Change
                </button>
              )}
              <button
                type="button"
                className="ump-player-chip striker"
                style={{ width: "100%" }}
                onClick={() =>
                  playerInfo.battingTeam &&
                  onPlayerNameClick(
                    playerInfo.battingTeam._id,
                    playerInfo.strikerIndex,
                    playerInfo.strikerName,
                  )
                }
              >
                <span className="ump-player-icon">🏏</span>
                <span className="ump-player-detail">
                  <span className="ump-player-role">
                    {isLastManStanding ? "Batsman (Last Man)" : "Striker"}
                  </span>
                  <span className="ump-player-text">
                    {playerInfo.strikerName}
                  </span>
                </span>
              </button>
            </div>

            {!isLastManStanding && (
              <>
                <button
                  type="button"
                  className="ump-swap-btn"
                  onClick={onSwapBatsmen}
                  title="Swap striker / non-striker"
                >
                  ⇄
                </button>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {onChangeNonStriker && (
                    <button
                      type="button"
                      className="ump-change-btn"
                      onClick={onChangeNonStriker}
                      style={{
                        fontSize: 10,
                        padding: "1px 6px",
                        alignSelf: "flex-start",
                      }}
                    >
                      Change
                    </button>
                  )}
                  <button
                    type="button"
                    className="ump-player-chip"
                    style={{ width: "100%" }}
                    onClick={() =>
                      playerInfo.battingTeam &&
                      onPlayerNameClick(
                        playerInfo.battingTeam._id,
                        playerInfo.nonStrikerIndex,
                        playerInfo.nonStrikerName,
                      )
                    }
                  >
                    <span className="ump-player-icon">🧍</span>
                    <span className="ump-player-detail">
                      <span className="ump-player-role">Non-Striker</span>
                      <span className="ump-player-text">
                        {playerInfo.nonStrikerName}
                      </span>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Row 2: Bowler + Change */}
          <div className="ump-player-row" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="ump-player-chip bowler"
              onClick={() =>
                playerInfo.bowlingTeam &&
                onPlayerNameClick(
                  playerInfo.bowlingTeam._id,
                  playerInfo.bowlerIndex,
                  playerInfo.bowlerName,
                )
              }
            >
              <span className="ump-player-icon">🎾</span>
              <span className="ump-player-detail">
                <span className="ump-player-role">Bowler</span>
                <span className="ump-player-text">{playerInfo.bowlerName}</span>
              </span>
            </button>
            <button
              type="button"
              className="ump-change-btn"
              onClick={onChangeBowler}
            >
              Change
            </button>
          </div>
        </div>

        {/* Runs */}
        <div className="ump-section">
          <div className="ump-section-label">Runs</div>
          <div className="ump-run-grid">
            {runButtons.map((run) => (
              <button
                type="button"
                key={`run-${run}`}
                className={`ump-run-btn${run === 4 ? " four" : run === 6 ? " six" : ""}`}
                onClick={() => handleTrackScore({ ballRuns: run })}
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
                handleTrackScore({
                  ballRuns: 1,
                  isExtra: true,
                  extraType: "wide",
                })
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
              onClick={() =>
                onWicketWithPlayerSelect({ ballRuns: 0, isWicket: true })
              }
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

      {/* Delete + Settings below controls */}
      <div className="ump-actions-footer">
        <button
          type="button"
          className="ump-delete-btn"
          onClick={deletePreviousBall}
        >
          Delete Previous Ball
        </button>
        {onSettingsClick && (
          <button
            type="button"
            className="ump-settings-btn"
            onClick={onSettingsClick}
          >
            Match Settings
          </button>
        )}
      </div>
    </div>
  );
};

export default UmpireControls;
