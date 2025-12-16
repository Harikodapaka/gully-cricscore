import { IBall } from "@/models/Ball";
import { BallDisplay } from "./ballDisplay";
import { Divider } from "./divider";

interface InningsDisplayProps {
    balls: IBall[];
    totalOvers: number;
}

export function InningsDisplay({ balls, totalOvers }: InningsDisplayProps) {
    if (!balls?.length) {
        return (
            <div className="text-center text-gray-500 py-8 font-semibold">
                No balls bowled yet
            </div>
        );
    }

    return (
        <>
            {Array.from({ length: totalOvers }, (_, overIdx) => overIdx)
                .reverse()
                .map((overIdx) => {
                    const ballsForOver = balls.filter(
                        (ball) => ball.overNumber === overIdx
                    );
                    if (ballsForOver.length === 0) return null;

                    return (
                        <div key={`over-${overIdx + 1}`}>
                            <Divider over={overIdx + 1} />
                            {ballsForOver.map((ball, i) => (
                                <BallDisplay
                                    key={`ball-${overIdx + 1}-${i}`}
                                    ballNumber={ball.ballNumber}
                                    runs={ball.runs}
                                    isWicket={ball.isWicket}
                                    extraType={ball.extraType}
                                    overNumber={ball.overNumber}
                                />
                            ))}
                        </div>
                    );
                })}
        </>
    );
}

