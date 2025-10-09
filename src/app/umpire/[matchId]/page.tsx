'use client';

import { useParams } from 'next/navigation';
import { BlueBtn, PageContainer } from '@/components/Styles';
import Modal from '@/components/Modal';
import { TrackScoreProps, UmpireControls } from '@/components/UmpireControls';
import { useEffect, useState } from 'react';
import { IMatchPopulated } from '@/models/Match';
import Link from 'next/link';
import { ITeam } from '@/models/Team';
import { IInnings } from '@/models/Innings';
import LoadingOverlay from '@/components/LoadingOverlay';
import { IBall } from '@/models/Ball';
import { set } from 'mongoose';

export default function UmpireScorePage() {
    const { matchId } = useParams();
    const [match, setMatch] = useState<IMatchPopulated>();
    const [teamDetails, setTeamDetails] = useState<ITeam>();
    const [inningsData, setInningsData] = useState<IInnings>();
    const [runs, setRuns] = useState(0);
    const [wickets, setWickets] = useState(0);
    const [oversCompleted, setOversCompleted] = useState('0.0');
    const [loading, setLoading] = useState(false);
    const [lastballSaved, setLastballSaved] = useState<IBall | null>(null);
    const formatOversCompleted = (o: string) => {
        const [over, ball] = o.split('.').map(Number);
        if (ball === 6) {
            return `${over + 1}.0`
        }
        return o;
    };


    const fetchMatchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/match/${matchId}/details`);
            if (!response.ok) {
                throw new Error('Failed to fetch match data');
            }
            const matchData = await response.json();

            setMatch(matchData.data);
            if (matchData?.data?.status === 'in-progress') {
                const inningsData = matchData.data.innings[(matchData.data.currentInnings ?? 1) - 1];
                setInningsData(inningsData);
                const teamDetails = matchData.data.teams.find((t: any) => t._id === inningsData.battingTeamId);
                setTeamDetails(teamDetails);
                setRuns(inningsData.score);
                setWickets(inningsData.wickets);
                setOversCompleted(formatOversCompleted(inningsData.oversCompleted));
                setLastballSaved(inningsData.balls && inningsData.balls.length > 0 ? inningsData.balls[0] : null);
            }
        } catch (error) {
            console.error('Error fetching match:', error);
            setMatch(undefined);
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast("Error fetching match", 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!matchId) return;
        fetchMatchData();
    }, [matchId]);

    const transitionInnings = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/match/${matchId}/transition-innings`, {
                method: 'PATCH',
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                throw new Error('Failed to transition innings');
            }
            await fetchMatchData();
        } catch (e) {
            console.error('Failed to transition innings:', e);
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast("Error transitioning innings", 'error');
            }
        } finally {
            setLoading(false);
        }
    }

    const trackScore = async ({
        ballRuns = 0,
        isExtra = false,
        extraType = 'none',
        isWicket = false
    }: TrackScoreProps) => {
        const [over, ball] = oversCompleted.split('.').map(Number);
        let newOver = over;
        let newBall = isExtra ? ball : ball + 1;
        if (newBall > 6) {
            newOver = newOver + 1;
            newBall = 0;
        }
        const body = {
            inningsId: inningsData?._id,
            overNumber: newOver,
            ballNumber: newBall,
            runs: ballRuns,
            isWicket,
            isExtra,
            extraType
        };
        setRuns((r: number) => r + ballRuns);
        if (!isExtra) {
            setOversCompleted((o) => {
                const [over, ball] = o.split('.').map(Number);
                let newOver = over;
                let newBall = ball + 1;
                if (newBall >= 6) {
                    newOver = newOver + 1;
                    newBall = 0;
                }
                return `${newOver}.${newBall}`;
            });
        }
        if (isWicket) {
            setWickets(w => w + 1);
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ball`, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) {
                throw new Error('Failed to track score');
            }
            const data = await res.json();
            const savedBall: IBall = data.data;
            setLastballSaved(savedBall);
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast("Saved 👍", 'success');
            }
            if (
                match?.status === 'in-progress' &&
                match?.currentInnings === 2 &&
                (
                    teamDetails?.numberOfPlayers === wickets ||
                    match?.overs === +(formatOversCompleted(`${newOver}.${newBall}`).split('.')[0]) ||
                    (match?.innings && match.innings[0]?.score !== undefined && (runs + ballRuns) > match.innings[0].score)
                )
            ) {
                await transitionInnings();
            }
        } catch (e) {
            console.log("error in tracking score:", e);
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast("Score update failed", 'error');
            }
        }
    }


    if (match?.status === 'completed' && match?.winnerMessage) {

        return (<Modal isOpen={true} title="Match completed 👾">
            <div className='flex flex-col gap-6'>
                <p className='text-lg'>{match?.winnerMessage} 🏆</p>
                <Link
                    href="/"
                    className={`${BlueBtn} animate-pulse`}
                >
                    Back to matches
                </Link>
            </div>
        </Modal>)
    }
    if (match?.currentInnings === 1 && (teamDetails?.numberOfPlayers === wickets || (match?.overs === +(oversCompleted.split('.')[0])))) {

        return (<Modal isOpen={true} title="Innings completed ✅">
            {loading && <LoadingOverlay />}
            <div className='flex flex-col gap-6 items-center'>
                <p className='text-md font-italic'>All players are out / Overs are completed.</p>
                <p className='text-lg'>Team {teamDetails?.name} scored <b>
                    {match?.innings[0]?.score}
                </b> runs</p>
                <button
                    onClick={transitionInnings}
                    className={`${BlueBtn} animate-pulse`}
                >
                    Start next innings
                </button>
            </div>
        </Modal>)
    }
    console.log("lastballSaved:", lastballSaved);


    const getTargetText = () => {
        if (match?.currentInnings !== 2 || !match?.innings || match.innings[0]?.score === undefined) {
            const ballsLeft = ((match?.overs ?? 0) * 6) - ((+oversCompleted.split('.')[0]) * 6 + (+oversCompleted.split('.')[1] || 0));
            return `Remaining balls: ${ballsLeft}`;
        }

        const target = match.innings[0].score + 1;
        const runsNeeded = target - runs;
        const ballsLeft = ((match.overs ?? 0) * 6) - ((+oversCompleted.split('.')[0]) * 6 + (+oversCompleted.split('.')[1] || 0));

        if (runsNeeded === 0) {
            return 'Match Tied!';
        } else if (runsNeeded < 0) {
            return 'Target Achieved!';
        } else {
            return `Needs ${runsNeeded} run${runsNeeded > 1 ? 's' : ''} in ${ballsLeft} ball${ballsLeft !== 1 ? 's' : ''}`;
        }
    }
    const deletePreviousBall = async () => {
        if (!lastballSaved) {
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast("No ball to delete", 'error');
            }
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ball/${lastballSaved._id}`, {
                method: 'DELETE',
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                throw new Error('Failed to delete last ball');
            }
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast("Last ball deleted!", 'success');
            }
            await fetchMatchData();
        } catch (e) {
            console.error('Failed to delete last ball:', e);
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast("Error deleting last ball", 'error');
            }
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className={PageContainer}>
            {loading && <LoadingOverlay />}
            {matchId && match ?
                (<UmpireControls
                    trackScore={trackScore}
                    name={teamDetails?.name || ''}
                    runs={runs}
                    wickets={wickets}
                    overs={oversCompleted}
                    target={getTargetText()}
                    deletePreviousBall={deletePreviousBall}
                />)
                :
                null
            }
        </div>
    );
}