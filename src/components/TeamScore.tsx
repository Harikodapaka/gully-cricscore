export const TeamScore = ({
    name,
    runs,
    wickets,
    overs,
    hasBorder = false
}: {
    name: string;
    runs: number;
    wickets: number;
    overs: string;
    hasBorder?: boolean;
}) => (
    <div className={hasBorder ? "border-t border-gray-300 mt-2 pt-2" : ""}>
        <p className="text-xs">{name}</p>
        <p className="text-lg font-semibold">
            {runs} - {wickets} ({overs})
        </p>
    </div>
);