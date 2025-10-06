export const MatchResult = ({ winner }: { winner: string | null }) => {
    if (!winner) return null;

    return (
        <div className="text-sm font-bold text-blue-500 mt-2 text-center">
            <p>** {winner} won the match 👏</p>
        </div>
    );
};