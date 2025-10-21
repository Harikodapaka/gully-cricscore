'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { BlueBtn, PageContainer } from '@/components/Styles';
import { TrackScoreProps, UmpireControls } from '@/components/UmpireControls';
import { formatOversCompleted } from '@/app/utils/formatOversCompleted';
import LoadingOverlay from '@/components/LoadingOverlay';
import Modal from '@/components/Modal';
import { IMatchPopulated } from '@/models/Match';
import { ITeam } from '@/models/Team';
import { IInningsPopulated } from '@/models/Innings';
import { IBall } from '@/models/Ball';
import { calculateNextBall } from '@/app/utils/calculateNextBall';
import { calculateBallsRemaining } from '@/app/utils/calculateBallsRemaining';

// Constants
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const showToast = (message: string, type: 'success' | 'error') => {
    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
        window.showToast(message, type);
    }
};

export default function UmpireScorePage() {
    const { matchId } = useParams();
    const router = useRouter();

    // State
    const [match, setMatch] = useState<IMatchPopulated>();
    const [teamDetails, setTeamDetails] = useState<ITeam>();
    const [inningsData, setInningsData] = useState<IInningsPopulated>();
    const [runs, setRuns] = useState(0);
    const [wickets, setWickets] = useState(0);
    const [oversCompleted, setOversCompleted] = useState('0.0');
    const [loading, setLoading] = useState(false);
    const [showInningsCompletePopup, setShowInningsCompletePopup] = useState(false);
    const [lastballSaved, setLastballSaved] = useState<IBall | null>(null);

    // Refs to prevent duplicate API calls
    const isTransitioningRef = useRef(false);
    const isFetchingRef = useRef(false);

    // Fetch match data
    const fetchMatchData = useCallback(async () => {
        if (!matchId || isFetchingRef.current) return;

        isFetchingRef.current = true;
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/match/${matchId}/details`);

            if (!response.ok) {
                throw new Error('Failed to fetch match data');
            }

            const matchData = await response.json();
            const fetchedMatch = matchData.data;

            setMatch(fetchedMatch);

            const currentInningsIndex = (fetchedMatch.currentInnings ?? 1) - 1;
            const currentInnings = fetchedMatch.innings[currentInningsIndex];

            setInningsData(currentInnings);

            const battingTeam = fetchedMatch.teams.find(
                (t: ITeam) => t._id === currentInnings.battingTeamId
            );

            setTeamDetails(battingTeam);
            setRuns(currentInnings.score || 0);
            setWickets(currentInnings.wickets || 0);
            setOversCompleted(formatOversCompleted(currentInnings.oversCompleted));

            const lastBall = currentInnings?.balls?.length > 0
                ? currentInnings.balls[0]
                : null;
            setLastballSaved(lastBall);

        } catch (error) {
            console.error('Error fetching match:', error);
            setMatch(undefined);
            showToast("Error fetching match", 'error');
            router.push('/');
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [matchId, router]);

    // Transition innings
    const transitionInnings = useCallback(async (shouldFetchMatch: boolean) => {
        if (isTransitioningRef.current) return;

        isTransitioningRef.current = true;
        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/match/${matchId}/transition-innings`,
                {
                    method: 'PATCH',
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to transition innings');
            }

            if (shouldFetchMatch) {
                await fetchMatchData();
            }

            setShowInningsCompletePopup(false);

        } catch (error) {
            console.error('Failed to transition innings:', error);
            showToast("Error transitioning innings", 'error');
        } finally {
            setLoading(false);
            isTransitioningRef.current = false;
        }
    }, [matchId, fetchMatchData]);

    // Track score
    const trackScore = useCallback(async ({
        ballRuns = 0,
        isExtra = false,
        extraType = 'none',
        isWicket = false
    }: TrackScoreProps) => {
        if (!inningsData?._id) {
            showToast("Innings data not available", 'error');
            return;
        }

        const { overNumber, ballNumber } = calculateNextBall(lastballSaved);

        const body = {
            inningsId: inningsData._id,
            overNumber,
            ballNumber,
            runs: ballRuns,
            isWicket,
            isExtra,
            extraType
        };

        // Optimistically update UI
        setRuns(prevRuns => prevRuns + ballRuns);
        if (!isExtra) {
            setOversCompleted(`${overNumber}.${ballNumber}`);
        }
        if (isWicket) {
            setWickets(prevWickets => prevWickets + 1);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/ball`, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                throw new Error('Failed to track score');
            }

            const data = await response.json();
            const savedBall: IBall = data.ball;
            setLastballSaved(savedBall);

            showToast("Saved 👍", 'success');

        } catch (error) {
            console.error("Error tracking score:", error);
            showToast("Score update failed", 'error');

            // Revert optimistic updates on error
            setRuns(prevRuns => prevRuns - ballRuns);
            if (!isExtra) {
                setOversCompleted(formatOversCompleted(inningsData.oversCompleted));
            }
            if (isWicket) {
                setWickets(prevWickets => prevWickets - 1);
            }
        }
    }, [inningsData, lastballSaved]);

    // Delete previous ball
    const deletePreviousBall = useCallback(async () => {
        if (!lastballSaved) {
            showToast("No ball to delete", 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/ball/${lastballSaved._id}`,
                {
                    method: 'DELETE',
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete last ball');
            }

            showToast("Last ball deleted!", 'success');
            await fetchMatchData();

        } catch (error) {
            console.error('Failed to delete last ball:', error);
            showToast("Error deleting last ball", 'error');
        } finally {
            setLoading(false);
        }
    }, [lastballSaved, fetchMatchData]);

    // Get target text for display
    const getTargetText = useCallback((): string => {
        if (!match) return '';

        const ballsLeft = calculateBallsRemaining(match.overs ?? 0, oversCompleted);

        // First innings - show remaining balls
        if (match.currentInnings !== 2 || !match.innings || match.innings[0]?.score === undefined) {
            return `Remaining balls: ${ballsLeft}`;
        }

        // Second innings - show target
        const firstInningsScore = match.innings?.[0]?.score ?? 0;
        const target = firstInningsScore + 1;
        const runsNeeded = target - runs;

        if (runsNeeded <= 0) {
            return 'Target Achieved!';
        }

        return `Needs ${runsNeeded} run${runsNeeded > 1 ? 's' : ''} in ${ballsLeft} ball${ballsLeft !== 1 ? 's' : ''}`;
    }, [match, runs, oversCompleted]);

    const checkInningsCompletion = useCallback(() => {
        if (!match || !teamDetails || loading || isTransitioningRef.current) return;

        const isAllOut = teamDetails.numberOfPlayers === wickets;
        const completedOvers = Number(formatOversCompleted(oversCompleted).split('.')[0]);
        const isOversCompleted = match.overs === completedOvers;

        // First innings - show popup
        if (match.currentInnings === 1 && (isAllOut || isOversCompleted)) {
            setShowInningsCompletePopup(true);
            return;
        }

        // Second innings - auto transition
        if (match.status === 'in-progress' && match.currentInnings === 2) {
            const firstInningsScore = match.innings?.[0]?.score;
            const hasWon = firstInningsScore !== undefined && runs > firstInningsScore;

            if (isAllOut || isOversCompleted || hasWon) {
                setTimeout(() => {
                    transitionInnings(true);
                }, 1000);
            }
        }
    }, [match, teamDetails, wickets, oversCompleted, runs, loading, transitionInnings, formatOversCompleted]);

    useEffect(() => {
        if (!matchId) return;
        fetchMatchData();
    }, [matchId, fetchMatchData]);

    useEffect(() => {
        checkInningsCompletion();
    }, [checkInningsCompletion]);

    if (match?.status === 'completed' && match?.winnerMessage) {
        return (
            <Modal isOpen={true} title="Match completed 👾">
                <div className='flex flex-col gap-6'>
                    <p className='text-lg'>{match.winnerMessage} 🏆</p>
                    <Link href="/" className={`${BlueBtn} text-center`}>
                        Back to matches
                    </Link>
                </div>
            </Modal>
        );
    }

    if (showInningsCompletePopup) {
        return (
            <Modal isOpen={true} title="Innings completed ✅">
                {loading && <LoadingOverlay />}
                <div className='flex flex-col gap-6 items-center'>
                    <p className='text-md font-italic'>
                        All players are out / Overs are completed.
                    </p>
                    <p className='text-lg'>
                        Team <b>{teamDetails?.name}</b> scored: <b>{runs}</b> runs
                    </p>
                    <button
                        onClick={() => transitionInnings(true)}
                        className={`${BlueBtn} text-center`}
                        disabled={loading}
                    >
                        Start next innings
                    </button>
                </div>
            </Modal>
        );
    }

    return (
        <div className={PageContainer}>
            {loading && <LoadingOverlay />}
            {matchId && match && (
                <UmpireControls
                    trackScore={trackScore}
                    name={teamDetails?.name || ''}
                    runs={runs}
                    wickets={wickets}
                    overs={oversCompleted}
                    target={getTargetText()}
                    deletePreviousBall={deletePreviousBall}
                />
            )}
        </div>
    );
}