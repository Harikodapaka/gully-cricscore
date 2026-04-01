// Maps runs/type to ESPN circle class and row accent class
function getBallStyle(
  runs: number,
  isWicket?: boolean,
  extraType?: string,
): { circleClass: string; rowClass: string; label: string } {
  if (isWicket) {
    const label = runs > 0 ? `W+${runs}` : "W";
    return { circleClass: "bcW", rowClass: "rW", label };
  }
  if (extraType === "wide") {
    return { circleClass: "bcX", rowClass: "", label: "WD" };
  }
  if (extraType === "noball") {
    const batRuns = runs - 1;
    const label = batRuns > 0 ? `NB+${batRuns}` : "NB";
    return { circleClass: "bcX", rowClass: "", label };
  }
  if (runs === 6) return { circleClass: "bc6", rowClass: "r6", label: "6" };
  if (runs === 4) return { circleClass: "bc4", rowClass: "r4", label: "4" };
  if (runs === 3) return { circleClass: "bc3", rowClass: "", label: "3" };
  if (runs === 2) return { circleClass: "bc2", rowClass: "", label: "2" };
  if (runs === 1) return { circleClass: "bc1", rowClass: "", label: "1" };
  return { circleClass: "bc0", rowClass: "", label: "0" };
}

const DOT_MSGS = [
  "Dot ball",
  "Tight! No run",
  "Defended solidly",
  "Nothing off that",
  "Maiden delivery!",
];
const ONE_MSGS = [
  "Quick single",
  "Pushed for one",
  "A cheeky single",
  "Clever placement!",
];
const TWO_MSGS = [
  "Good running!",
  "A couple",
  "Two and turn!",
  "Quick between wickets",
];
const THREE_MSGS = [
  "Three! Excellent hustle",
  "Great running — 3!",
  "All the way for 3!",
];
const FOUR_MSGS = [
  "FOUR! Boundary!",
  "Racing to the rope!",
  "Through the gap — FOUR!",
  "Cracking shot! Four!",
];
const SIX_MSGS = [
  "SIX! Gone into orbit!",
  "Maximum! What a strike!",
  "Into the crowd — SIX!",
  "Monstrous hit! Six!",
];
const WIDE_MSGS = [
  "Wide! Free hit next",
  "Too far outside — Wide",
  "Wayward delivery",
  "Missing the stumps — Wide",
];
const WICKET_MSGS = [
  "Timber! BOWLED!",
  "OUT! What a delivery!",
  "Gone — clean bowled!",
  "Stumps shattered!",
  "WICKET! Back to the hut!",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function getBallMessage(
  runs: number,
  isWicket?: boolean,
  extraType?: string,
  seed = 0,
): string {
  if (isWicket) {
    if (runs > 0) return `Run Out! +${runs} run${runs !== 1 ? "s" : ""}`;
    return pick(WICKET_MSGS, seed);
  }
  if (extraType === "wide") return pick(WIDE_MSGS, seed);
  if (extraType === "noball") {
    const batRuns = runs - 1;
    return batRuns > 0
      ? `No Ball · +${batRuns} run${batRuns !== 1 ? "s" : ""}`
      : "No Ball!";
  }
  if (runs === 6) return pick(SIX_MSGS, seed);
  if (runs === 4) return pick(FOUR_MSGS, seed);
  if (runs === 3) return pick(THREE_MSGS, seed);
  if (runs === 2) return pick(TWO_MSGS, seed);
  if (runs === 1) return pick(ONE_MSGS, seed);
  return pick(DOT_MSGS, seed);
}

export const BallDisplay = ({
  ballNumber,
  runs,
  overNumber,
  isWicket,
  extraType,
  batsmanName,
}: {
  ballNumber: number;
  runs: number;
  overNumber: number;
  isWicket?: boolean;
  extraType?: string;
  batsmanName?: string;
}) => {
  const seed = overNumber * 10 + ballNumber;
  const { circleClass, rowClass, label } = getBallStyle(
    runs,
    isWicket,
    extraType,
  );
  const message = getBallMessage(runs, isWicket, extraType, seed);

  return (
    <div className={`ball-row${rowClass ? ` ${rowClass}` : ""}`}>
      <div className={`ball-circle ${circleClass}`}>{label}</div>
      <div className="ball-main">
        <div>{message}</div>
        {batsmanName && <div className="ball-players">{batsmanName}</div>}
      </div>
      <div className="ball-num">
        {overNumber}.{ballNumber}
      </div>
    </div>
  );
};
