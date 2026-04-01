// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrackScoreProps } from "@/components/UmpireControls";
import { UmpireControls } from "@/components/UmpireControls";

const DEFAULT_PLAYER_INFO = {
  strikerName: "Player 1",
  nonStrikerName: "Player 2",
  bowlerName: "Player 1",
  battingTeam: {
    _id: "team1",
    name: "Team Alpha",
    numberOfPlayers: 6,
    battingOrder: "1st" as const,
    players: [
      "Player 1",
      "Player 2",
      "Player 3",
      "Player 4",
      "Player 5",
      "Player 6",
    ],
  },
  bowlingTeam: {
    _id: "team2",
    name: "Team Beta",
    numberOfPlayers: 6,
    battingOrder: "2nd" as const,
    players: [
      "Player 1",
      "Player 2",
      "Player 3",
      "Player 4",
      "Player 5",
      "Player 6",
    ],
  },
  strikerIndex: 0,
  nonStrikerIndex: 1,
  bowlerIndex: 0,
  nextBatsmanIndex: 2,
};

const DEFAULT_PROPS = {
  name: "Team Alpha",
  runs: 42,
  wickets: 3,
  overs: "2.4",
  trackScore: vi.fn() as unknown as ReturnType<typeof vi.fn> &
    ((score: TrackScoreProps) => void),
  deletePreviousBall: vi.fn(),
  playerInfo: DEFAULT_PLAYER_INFO,
  onPlayerNameClick: vi.fn(),
  onWicketWithPlayerSelect: vi.fn(),
  onSwapBatsmen: vi.fn(),
  onChangeBowler: vi.fn(),
  onSettingsClick: vi.fn(),
  onOverComplete: vi.fn(),
  totalOvers: 10,
};

// Helper: get the ump-controls container (below the scoreboard)
const getControlsSection = () =>
  screen.getByText("Runs").closest("div.ump-controls") as HTMLElement;

describe("UmpireControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Rendering ────────────────────────────────────────────────────────────

  it("renders the team name", () => {
    render(<UmpireControls {...DEFAULT_PROPS} />);
    expect(screen.getByText("Team Alpha")).toBeInTheDocument();
  });

  it("renders the score correctly", () => {
    render(<UmpireControls {...DEFAULT_PROPS} />);
    // runs and wickets live in ump-score-runs
    const scoreEl = screen
      .getByText("42")
      .closest(".ump-score-runs") as HTMLElement;
    expect(scoreEl).not.toBeNull();
    expect(scoreEl.textContent?.replace(/\s/g, "")).toBe("42/3");
  });

  it("renders the overs correctly (formatted)", () => {
    render(<UmpireControls {...DEFAULT_PROPS} />);
    // formatOversCompleted("2.4") → "2.4" (unchanged)
    expect(screen.getByText(/2\.4 overs/)).toBeInTheDocument();
  });

  it("renders an optional target text", () => {
    render(
      <UmpireControls {...DEFAULT_PROPS} target="Needs 20 runs in 14 balls" />,
    );
    expect(screen.getByText("Needs 20 runs in 14 balls")).toBeInTheDocument();
  });

  it("does not render a target section when target is undefined", () => {
    render(<UmpireControls {...DEFAULT_PROPS} />);
    expect(screen.queryByText(/Needs/)).not.toBeInTheDocument();
  });

  it("renders all run buttons: 0, 1, 2, 3, 4, 6", () => {
    render(<UmpireControls {...DEFAULT_PROPS} />);
    const controls = getControlsSection();
    const runSection = within(controls)
      .getByText("Runs")
      .closest("div.ump-section") as HTMLElement;
    for (const label of ["0", "1", "2", "3", "4", "6"]) {
      expect(
        within(runSection).getByRole("button", { name: label }),
      ).toBeInTheDocument();
    }
  });

  it("renders Wide and No Ball extra buttons", () => {
    render(<UmpireControls {...DEFAULT_PROPS} />);
    expect(screen.getByRole("button", { name: "Wide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No Ball" })).toBeInTheDocument();
  });

  it("renders Wicket and Run Out wicket buttons", () => {
    render(<UmpireControls {...DEFAULT_PROPS} />);
    // Use role query — only buttons have the role "button"
    expect(screen.getByRole("button", { name: "Wicket" })).toBeInTheDocument();
    // Run Out appears only in the wicket section on initial render (no popups open)
    const allRunOutBtns = screen.getAllByRole("button", { name: "Run Out" });
    expect(allRunOutBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the delete previous ball button", () => {
    render(<UmpireControls {...DEFAULT_PROPS} />);
    expect(
      screen.getByRole("button", { name: /Delete Previous Ball/i }),
    ).toBeInTheDocument();
  });

  // ─── Run buttons ──────────────────────────────────────────────────────────

  it("calls trackScore with correct ballRuns when a run button is clicked", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    const controls = getControlsSection();
    const runSection = within(controls)
      .getByText("Runs")
      .closest("div.ump-section") as HTMLElement;
    await user.click(within(runSection).getByRole("button", { name: "4" }));
    expect(DEFAULT_PROPS.trackScore).toHaveBeenCalledWith({ ballRuns: 4 });
  });

  it("calls trackScore with ballRuns: 0 for dot ball", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    const controls = getControlsSection();
    const runSection = within(controls)
      .getByText("Runs")
      .closest("div.ump-section") as HTMLElement;
    await user.click(within(runSection).getByRole("button", { name: "0" }));
    expect(DEFAULT_PROPS.trackScore).toHaveBeenCalledWith({ ballRuns: 0 });
  });

  it("calls trackScore with ballRuns: 6 for a six", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    const controls = getControlsSection();
    const runSection = within(controls)
      .getByText("Runs")
      .closest("div.ump-section") as HTMLElement;
    await user.click(within(runSection).getByRole("button", { name: "6" }));
    expect(DEFAULT_PROPS.trackScore).toHaveBeenCalledWith({ ballRuns: 6 });
  });

  // ─── Wide ─────────────────────────────────────────────────────────────────

  it("calls trackScore with wide extra when Wide button is clicked", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole("button", { name: "Wide" }));
    expect(DEFAULT_PROPS.trackScore).toHaveBeenCalledWith({
      ballRuns: 1,
      isExtra: true,
      extraType: "wide",
    });
  });

  // ─── No Ball popup ────────────────────────────────────────────────────────

  it("opens No Ball popup when No Ball button is clicked", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole("button", { name: "No Ball" }));
    expect(screen.getByText("No-ball — select runs")).toBeInTheDocument();
  });

  it("No Ball popup: Run Out button calls onWicketWithPlayerSelect with noball + isWicket and closes popup", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole("button", { name: "No Ball" }));

    // Inside the noball popup, click "Run Out"
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Run Out" }));

    expect(DEFAULT_PROPS.onWicketWithPlayerSelect).toHaveBeenCalledWith({
      ballRuns: 1,
      isExtra: true,
      extraType: "noball",
      isWicket: true,
      isRunOut: true,
    });
    expect(screen.queryByText("No-ball — select runs")).not.toBeInTheDocument();
  });

  it("No Ball popup: selecting 0 runs calls trackScore with ballRuns 1 (no-ball penalty)", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole("button", { name: "No Ball" }));

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "0" }));

    expect(DEFAULT_PROPS.trackScore).toHaveBeenCalledWith({
      ballRuns: 1, // 0 bat runs + 1 no-ball penalty
      isExtra: true,
      extraType: "noball",
    });
    expect(screen.queryByText("No-ball — select runs")).not.toBeInTheDocument();
  });

  it("No Ball popup: selecting 4 runs calls trackScore with ballRuns 5", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole("button", { name: "No Ball" }));

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "4" }));

    expect(DEFAULT_PROPS.trackScore).toHaveBeenCalledWith({
      ballRuns: 5, // 4 bat runs + 1 no-ball penalty
      isExtra: true,
      extraType: "noball",
    });
  });

  // ─── Wicket ───────────────────────────────────────────────────────────────

  it("calls onWicketWithPlayerSelect with isWicket true when Wicket button is clicked", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole("button", { name: "Wicket" }));
    expect(DEFAULT_PROPS.onWicketWithPlayerSelect).toHaveBeenCalledWith({
      ballRuns: 0,
      isWicket: true,
    });
  });

  // ─── Run Out popup ────────────────────────────────────────────────────────

  it("opens Run Out popup when Run Out button (wicket section) is clicked", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    // On initial render only one "Run Out" button is visible (no popups open yet)
    const runOutBtn = screen.getByRole("button", { name: "Run Out" });
    await user.click(runOutBtn);
    expect(screen.getByText("Run Out — select runs")).toBeInTheDocument();
  });

  it("Run Out popup: selecting 2 runs calls onWicketWithPlayerSelect with isWicket and ballRuns 2", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole("button", { name: "Run Out" }));

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "2" }));

    expect(DEFAULT_PROPS.onWicketWithPlayerSelect).toHaveBeenCalledWith({
      ballRuns: 2,
      isWicket: true,
      isRunOut: true,
    });
    expect(screen.queryByText("Run Out — select runs")).not.toBeInTheDocument();
  });

  it("Run Out popup: Cancel closes popup without calling trackScore", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole("button", { name: "Run Out" }));

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Run Out — select runs")).not.toBeInTheDocument();
    expect(DEFAULT_PROPS.trackScore).not.toHaveBeenCalled();
  });

  // ─── Delete previous ball ─────────────────────────────────────────────────

  it("calls deletePreviousBall when Delete Previous Ball button is clicked", async () => {
    const user = userEvent.setup();
    render(<UmpireControls {...DEFAULT_PROPS} />);
    await user.click(
      screen.getByRole("button", { name: /Delete Previous Ball/i }),
    );
    expect(DEFAULT_PROPS.deletePreviousBall).toHaveBeenCalledOnce();
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  it("renders score of 0/0 correctly", () => {
    render(<UmpireControls {...DEFAULT_PROPS} runs={0} wickets={0} />);
    // Check the score container's full text content
    const scoreEl = document.querySelector(".ump-score-runs") as HTMLElement;
    expect(scoreEl.textContent?.replace(/\s/g, "")).toBe("0/0");
  });

  it("formats overs correctly when ball 6 is completed (rolls over display)", () => {
    // formatOversCompleted("1.6") → "2.0"
    render(<UmpireControls {...DEFAULT_PROPS} overs="1.6" />);
    expect(screen.getByText(/2\.0 overs/)).toBeInTheDocument();
  });
});
