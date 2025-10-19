import { getRunMessage, getRunsIcon } from "./utils";

export const BallDisplay = ({
    ballNumber,
    runs,
    overNumber,
    isWicket,
    extraType
}: {
    ballNumber: number;
    runs: number;
    overNumber: number;
    isWicket?: boolean;
    extraType?: string;
}) => {
    const type = isWicket ? 'wicket' : extraType;
    return (
        <div className="flex gap-3 my-4 items-center">
            <p className={`h-10 w-10 bg-orange-400 flex items-center justify-center shrink-0 rounded-full border border-orange-100 text-white font-bold ${(extraType === 'noball' && runs > 1) || (isWicket && runs > 0) ? 'text-xs' : ''}`}>
                {getRunsIcon(runs, isWicket, type)}
            </p>
            <p>{getRunMessage(type && type !== 'none' ? type : runs)}</p>
            <p className="h-8 w-14 bg-blue-400 flex items-center justify-center shrink-0 rounded border border-blue-200 text-white ml-auto">
                ({overNumber}.{ballNumber})
            </p>
        </div>
    )
};