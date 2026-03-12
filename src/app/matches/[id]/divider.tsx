export const Divider = ({
  over,
  runs,
  wickets,
}: {
  over: number;
  runs: number;
  wickets: number;
}) => {
  const summary =
    wickets > 0
      ? `${runs} run${runs !== 1 ? "s" : ""} · ${wickets} wkt${wickets !== 1 ? "s" : ""}`
      : `${runs} run${runs !== 1 ? "s" : ""}`;

  return (
    <div className="over-head">
      <span className="over-lbl">Over {over}</span>
      <span className="over-summary">{summary}</span>
    </div>
  );
};
