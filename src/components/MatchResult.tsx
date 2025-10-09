export const MatchResult = ({ winner, isTied }: { winner: string | null, isTied?: boolean }) => {
    return (
        <div className="text-sm font-bold text-orange-500 mt-2 text-center">
            {winner && <p>** {winner} won the match 👏</p>}
            {isTied && <p>** Match ended in a tie 🤝</p>}
        </div>
    );
};