import React from 'react';

export interface TeamScoreProps {
    name: string;
    runs: number;
    wickets: number;
    overs: string;
    target?: string;
}
const TeamScore = ({ name, runs, wickets, overs, target }: TeamScoreProps) => (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 mb-4 shadow-lg">
        <div className="flex items-center justify-between text-white">
            <div>
                <h2 className="text-3xl font-bold">{name}</h2>
                <p className="text-blue-100 text-sm mt-1">Batting</p>
            </div>
            <div className="text-right">
                <div className="text-5xl font-bold">
                    {runs}/{wickets}
                </div>
                <p className="text-blue-100 text-lg mt-1">{overs} overs</p>
            </div>
        </div>
        {target && <div className="text-right">
            <p className="text-blue-100 text-lg mt-1">{target}</p>
        </div>}
    </div>
);

export interface TrackScoreProps {
    ballRuns: number;
    isExtra?: boolean;
    extraType?: string;
    isWicket?: boolean;
}
export const UmpireControls = ({ name, runs, wickets, overs, target, trackScore }: TeamScoreProps & { trackScore: (score: TrackScoreProps) => void }) => {
    const runButtons = [0, 1, 2, 3, 4, 6];

    return (
        <div className="">
            <TeamScore name={name} runs={runs} wickets={wickets} overs={overs} target={target} />

            <div className="bg-white rounded-2xl shadow-xl p-4 space-y-8">
                {/* Runs Section */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Runs</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {runButtons.map((run) => (
                            <button
                                key={`run-${run}`}
                                className="h-20 bg-gradient-to-br from-slate-100 to-slate-200 hover:from-blue-500 hover:to-blue-600 text-slate-700 hover:text-white font-bold text-2xl rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                                onClick={() => trackScore({
                                    ballRuns: run
                                })}
                            >
                                {run}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Extras Section */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Extras</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="h-16 bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-500 hover:to-amber-600 text-slate-700 hover:text-white font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                            onClick={() => trackScore({
                                ballRuns: 1,
                                isExtra: true,
                                extraType: 'wide',
                            })}
                        >
                            Wide
                        </button>
                        <button className="h-16 bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-500 hover:to-amber-600 text-slate-700 hover:text-white font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                            onClick={() => trackScore({
                                ballRuns: 1,
                                isExtra: true,
                                extraType: 'noball',
                            })}
                        >
                            No Ball
                        </button>
                    </div>
                </div>

                {/* Wicket Section */}
                <div>
                    <button className="w-full h-20 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-xl rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
                        onClick={() => trackScore({
                            ballRuns: 0,
                            isWicket: true
                        })}>
                        🏏 Wicket
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UmpireControls;