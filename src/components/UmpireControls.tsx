import React from 'react';
import Modal from './Modal';
import { DeleteBallBtn, RunsBtn, UmpireExtraBtn, WicketBtn } from './Styles';
import { formatOversCompleted } from '@/app/utils/formatOversCompleted';

export interface TeamScoreBoardProps {
    name: string;
    runs: number;
    wickets: number;
    overs: string;
    target?: string;
}
const TeamScoreBoard = ({ name, runs, wickets, overs, target }: TeamScoreBoardProps) => (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 mb-4 shadow-lg dark:bg-gradient-to-r dark:from-gray-200 dark:to-gray-200">
        <div className="flex items-center justify-between text-white dark:text-slate-700">
            <div>
                <h2 className="text-3xl font-bold">{name}</h2>
                <p className="text-blue-100 text-sm mt-1 dark:text-slate-700">Batting 🏏</p>
            </div>
            <div className="text-right dark:text-slate-700">
                <div className="text-5xl font-bold">
                    {runs}/{wickets}
                </div>
                <p className="text-blue-100 text-lg mt-1 dark:text-slate-700">({formatOversCompleted(overs)}) overs</p>
            </div>
        </div>
        {target && <div className="text-right flex justify-center">
            <p className="text-blue-100 text-sm mt-1 dark:text-slate-700">{target}</p>
        </div>}
    </div>
);

export interface TrackScoreProps {
    ballRuns: number;
    isExtra?: boolean;
    extraType?: string;
    isWicket?: boolean;
}

export interface UmpireControlsProps extends TeamScoreBoardProps {
    trackScore: (score: TrackScoreProps) => void;
    deletePreviousBall: () => void;
}

export const UmpireControls = ({ name, runs, wickets, overs, target, trackScore, deletePreviousBall }: UmpireControlsProps) => {
    const runButtons = [0, 1, 2, 3, 4, 6];
    const [noBallPopup, setNoBallPopup] = React.useState(false);
    return (
        <div className="">
            <TeamScoreBoard name={name} runs={runs} wickets={wickets} overs={overs} target={target} />
            {noBallPopup && (<Modal isOpen={true} title="No-ball Extras">
                <div className='flex flex-col gap-6 items-center'>
                    <p className='text-md font-italic dark:text-slate-700'>Select runs scored on No-ball</p>
                    <div className="grid grid-cols-3 gap-3">
                        {runButtons.map((run) => (
                            <button
                                key={`noball-run-${run}`}
                                className={`${RunsBtn} w-20`}
                                onClick={() => {
                                    trackScore({
                                        ballRuns: run + 1,
                                        isExtra: true,
                                        extraType: 'noball',
                                    });
                                    setNoBallPopup(false);
                                }}
                            >
                                {run}
                            </button>
                        ))}
                    </div>
                    <button className={DeleteBallBtn}
                        onClick={() => {
                            trackScore({
                                ballRuns: 1,
                                isExtra: true,
                                extraType: 'noball',
                                isWicket: true,
                            });
                            setNoBallPopup(false);
                        }}>
                        Run out
                    </button>
                </div>
            </Modal>)}
            <div className="bg-white rounded-2xl shadow-xl px-4 py-6 space-y-8">
                {/* Runs Section */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Runs</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {runButtons.map((run) => (
                            <button
                                key={`run-${run}`}
                                className={RunsBtn}
                                onClick={() => trackScore({
                                    ballRuns: run,
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
                        <button className={UmpireExtraBtn}
                            onClick={() => trackScore({
                                ballRuns: 1,
                                isExtra: true,
                                extraType: 'wide',
                            })}
                        >
                            Wide 🤷‍♂️
                        </button>
                        <button className={UmpireExtraBtn}
                            onClick={() => setNoBallPopup(true)}
                        >
                            No Ball 🚫
                        </button>
                    </div>
                </div>

                {/* Wicket Section */}
                <div>
                    <button className={WicketBtn}
                        onClick={() => trackScore({
                            ballRuns: 0,
                            isWicket: true
                        })}>
                        🏏 Wicket
                    </button>
                </div>
            </div>
            <div className='mt-12'>
                <button className={DeleteBallBtn}
                    onClick={deletePreviousBall}>
                    Delete previous ball
                </button>
            </div>
        </div>
    );
};

export default UmpireControls;