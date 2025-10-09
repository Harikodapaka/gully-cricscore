export interface TeamScoreProps {
    name: string;
    runs: number;
    wickets: number;
    overs: string;
    batting?: boolean;
    hasBorder?: boolean;
}

export const TeamScore = ({
    name,
    runs,
    wickets,
    overs,
    batting,
    hasBorder = false
}: TeamScoreProps) => (
    <div className={hasBorder ? "border-t border-gray-300 mt-2 pt-2" : ""}>
        <p className="text-xs">{batting && <span>🏏</span>} {name}</p>
        <p className="text-lg font-semibold">
            {runs} - {wickets} {overs && `(${overs})`}
        </p>
    </div>
);