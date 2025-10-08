export const MatchInfo = ({
    date,
    venue
}: {
    date: string;
    venue: string;
}) => (
    <div className="text-xs flex justify-end items-center h-6 px-4 bg-gray-200 font-light">
        <p className="shrink-0">🗓 {date} |</p>
        <p className="truncate">📍 {venue}</p>
    </div>
);