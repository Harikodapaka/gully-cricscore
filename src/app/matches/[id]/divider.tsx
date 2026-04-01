export const Divider = ({
  over,
  runs,
  wickets,
  bowlerName,
}: {
  over: number;
  runs: number;
  wickets: number;
  bowlerName?: string;
}) => {
  const summary =
    wickets > 0
      ? `${runs} run${runs !== 1 ? "s" : ""} · ${wickets} wkt${wickets !== 1 ? "s" : ""}`
      : `${runs} run${runs !== 1 ? "s" : ""}`;

  return (
    <div className="over-head">
      <span className="over-lbl">
        Over {over}
        {bowlerName ? ` — ${bowlerName}` : ""}
      </span>
      <span className="over-summary">{summary}</span>
    </div>
  );
};
