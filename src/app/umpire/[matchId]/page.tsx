'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useCallback, useRef, useState } from 'react';
import { BlueBtn, PageContainer } from '@/components/Styles';
import { TrackScoreProps, UmpireControls } from '@/components/UmpireControls';
import { formatOversCompleted } from '@/app/utils/formatOversCompleted';
import LoadingOverlay from '@/components/LoadingOverlay';
import Modal from '@/components/Modal';
import { calculateNextBall } from '@/app/utils/calculateNextBall';
import { calculateBallsRemaining } from '@/app/utils/calculateBallsRemaining';
import { useMatchData } from '@/hooks/useMatchData';
import { matchApi } from '@/services/matchApi';
import { showToast } from '@/utils/toast';
import { MATCH_STATUS, INNINGS } from '@/constants/match';
import { getInningsCompletionStatus, hasSecondInningsWon } from '@/utils/inningsHelpers';

export default function UmpireScorePage() {
    const { matchId } = useParams();

    // Custom hook for match data
    const {
        match,
        teamDetails,
        inningsData,
        scoreState,
        lastBallSaved,
        loading,
        setScoreState,
        setLastBallSaved,
        setLoading,
        fetchMatchData,
    } = useMatchData(matchId);

    const { runs, wickets, oversCompleted } = scoreState;

    // Local state for UI
    const [showInningsCompletePopup, setShowInningsCompletePopup] = useState(false);

    // Ref to prevent duplicate transition calls
    const isTransitioningRef = useRef(false);

    // Transition innings
    const transitionInnings = useCallback(async (shouldFetchMatch: boolean) => {
        if (isTransitioningRef.current || !matchId) return;

        isTransitioningRef.current = true;
        setLoading(true);

        try {
            await matchApi.transitionInnings(matchId);

            if (shouldFetchMatch) {
                await fetchMatchData();
            }

            setShowInningsCompletePopup(false);
        } catch (error) {
            console.error('Failed to transition innings:', error);
            showToast('Error transitioning innings', 'error');
        } finally {
            setLoading(false);
            isTransitioningRef.current = false;
        }
    }, [matchId, fetchMatchData, setLoading]);

    // Track score with optimistic updates
    const trackScore = useCallback(async ({
        ballRuns = 0,
        isExtra = false,
        extraType = 'none',
        isWicket = false,
    }: TrackScoreProps) => {
        if (!inningsData?._id || !matchId) {
            showToast('Innings data not available', 'error');
            return;
        }

        const { overNumber, ballNumber } = calculateNextBall(lastBallSaved);

        const body = {
            inningsId: String(inningsData._id),
            overNumber,
            ballNumber,
            runs: ballRuns,
            isWicket,
            isExtra,
            extraType,
            matchId,
        };

        // Store previous state for rollback
        const previousState = { ...scoreState };

        // Optimistically update UI
        setScoreState(prev => ({
            runs: prev.runs + ballRuns,
            wickets: isWicket ? prev.wickets + 1 : prev.wickets,
            oversCompleted: isExtra ? prev.oversCompleted : `${overNumber}.${ballNumber}`,
        }));

        try {
            const data = await matchApi.trackBall(body);
            setLastBallSaved(data.ball);
            showToast('Saved 👍', 'success');
        } catch (error) {
            console.error('Error tracking score:', error);
            showToast('Score update failed', 'error');

            // Revert optimistic updates on error
            setScoreState(previousState);
        }
    }, [inningsData, lastBallSaved, matchId, scoreState, setScoreState, setLastBallSaved]);

    // Delete previous ball
    const deletePreviousBall = useCallback(async () => {
        if (!lastBallSaved) {
            showToast('No ball to delete', 'error');
            return;
        }

        setLoading(true);

        try {
            await matchApi.deleteBall(String(lastBallSaved._id));
            showToast('Last ball deleted!', 'success');
            await fetchMatchData();
        } catch (error) {
            console.error('Failed to delete last ball:', error);
            showToast('Error deleting last ball', 'error');
        } finally {
            setLoading(false);
        }
    }, [lastBallSaved, fetchMatchData, setLoading]);

    // Get target text for display
    const getTargetText = useCallback((): string => {
        if (!match) return '';

        const ballsLeft = calculateBallsRemaining(match.overs ?? 0, oversCompleted);

        // First innings - show remaining balls
        if (match.currentInnings !== INNINGS.SECOND || !match.innings || match.innings[0]?.score === undefined) {
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

    // Check innings completion
    const checkInningsCompletion = useCallback(() => {
        if (!match || !teamDetails || loading || isTransitioningRef.current) return;

        const { isAllOut, isOversCompleted } = getInningsCompletionStatus(
            teamDetails.numberOfPlayers,
            wickets,
            match.overs ?? 0,
            oversCompleted
        );

        // First innings - show popup
        if (match.currentInnings === INNINGS.FIRST && (isAllOut || isOversCompleted)) {
            setShowInningsCompletePopup(true);
            return;
        }

        // Second innings - auto transition
        if (match.status === MATCH_STATUS.IN_PROGRESS && match.currentInnings === INNINGS.SECOND) {
            const firstInningsScore = match.innings?.[0]?.score;
            const hasWon = hasSecondInningsWon(firstInningsScore, runs);

            if (isAllOut || isOversCompleted || hasWon) {
                setTimeout(() => {
                    transitionInnings(true);
                }, 1000);
            }
        }
    }, [match, teamDetails, wickets, oversCompleted, runs, loading, transitionInnings]);

    // Initial fetch
    useEffect(() => {
        if (!matchId) return;
        fetchMatchData();
    }, [matchId, fetchMatchData]);

    // Check completion on state changes
    useEffect(() => {
        checkInningsCompletion();
    }, [checkInningsCompletion]);

    // Match completed view
    if (match?.status === MATCH_STATUS.COMPLETED && match?.winnerMessage) {
        return (
            <Modal isOpen={true} title="Match completed 👾">
                <div className="flex flex-col gap-6">
                    <p className="text-lg dark:text-black">{match.winnerMessage} 🏆</p>
                    <Link href="/" className={`${BlueBtn} text-center`}>
                        Back to matches
                    </Link>
                </div>
            </Modal>
        );
    }

    // Innings complete popup
    if (showInningsCompletePopup) {
        return (
            <Modal isOpen={true} title="Innings completed ✅">
                {loading && <LoadingOverlay />}
                <div className="flex flex-col gap-6 items-center">
                    <p className="text-md font-italic dark:text-black">
                        All players are out / Overs are completed.
                    </p>
                    <p className="text-lg dark:text-black">
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
