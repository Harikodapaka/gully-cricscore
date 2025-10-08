'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Roles } from '@/types/roles';
import { BlueBtnOutlined, PageContainer } from '@/components/Styles';
import Alert from '@/components/Alert';
import Modal from '@/components/Modal';
import { TrackScoreProps, UmpireControls } from '@/components/UmpireControls';
import { useEffect, useState } from 'react';
import { UnauthenticatedPage } from '../unauthenticatedPage';

export default function UmpireScorePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { matchId } = useParams();
    const [match, setMatch] = useState<any>();
    const [teamDetails, setTeamDetails] = useState<any>();
    const [inningsData, setInningsData] = useState<any>();
    const [runs, setRuns] = useState(0);
    const [wickets, setWickets] = useState(0);
    const [oversCompleted, setOversCompleted] = useState('0.0');

    const formatOversCompleted = (o: string) => {
        const [over, ball] = o.split('.').map(Number);
        if (ball === 6) {
            return `${over + 1}.0`
        }
        return o;
    };
    useEffect(() => {
        if (!matchId) return;

        const fetchMatchData = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/match/${matchId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch match data');
                }
                const matchData = await response.json();
                console.log("Fetched match data:", matchData.data);

                setMatch(matchData.data);
                const inningsData = matchData.data.innings[(matchData.data.currentInnings ?? 1) - 1];
                setInningsData(inningsData);
                const teamDetails = matchData.data.teams.find((t: any) => t._id === inningsData.battingTeamId);
                setTeamDetails(teamDetails);
                setRuns(inningsData.score);
                setWickets(inningsData.wickets);
                setOversCompleted(formatOversCompleted(inningsData.oversCompleted));
            } catch (error) {
                console.error('Error fetching match:', error);
                setMatch(undefined);
            }
        };

        fetchMatchData();
    }, [matchId]);

    const goToHome = () => router.push('/');


    const trackScore = ({
        runs = 0,
        isExtra = false,
        extraType = 'none',
        isWicket = false
    }: TrackScoreProps) => {
        const [over, ball] = oversCompleted.split('.').map(Number);
        let newOver = over;
        let newBall = isExtra ? ball : ball + 1
        if (newBall > 6) {
            newOver = newOver + 1;
            newBall = 0;
        }
        const body = {
            inningsId: inningsData._id,
            overNumber: newOver,
            ballNumber: newBall,
            runs,
            isWicket,
            isExtra,
            extraType
        }
        console.log("body to send:", body);
        setRuns((r: number) => r + runs);
        if (!isExtra) {
            setOversCompleted((o) => {
                const [over, ball] = o.split('.').map(Number);
                let newOver = over;
                let newBall = ball + 1
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
            fetch('http://localhost:3000/api/ball', {
                method: 'POST',
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json" },

            })
        } catch (e) {
            console.log("error occured:", e);
        }
    }


    if (status === 'unauthenticated') {
        return (
            <UnauthenticatedPage router={router} />
        );
    }

    if (!session) {
        return null;
    }

    if (session.user.role === Roles.spectator.toString()) {
        return (<div className={PageContainer}>
            <Alert
                variant="error"
                title="Oops!"
                message={
                    <div className={`flex flex-col gap-3`}>
                        <p className='font-bold'>You dont have permission to view this page.</p>
                        <button
                            onClick={goToHome}
                            className={`${BlueBtnOutlined} max-w-fit flex items-center gap-2`}
                        >
                            Back to home
                        </button>
                    </div>
                }
                onClose={goToHome}
            />
        </div>)
    }

    if (teamDetails?.numberOfPlayers === wickets) {

        return (<Modal isOpen={true} title="Innings is Over">
            <div className='flex flex-col gap-6'>
                <p className='text-lg'>All players are out / overs are completed.</p>
                <button
                    onClick={goToHome}
                    className={`${BlueBtnOutlined} max-w-fit flex items-center gap-2`}
                >
                    Start next innings
                </button>
            </div>
        </Modal>)
    }


    return (
        <div className={PageContainer}>
            {matchId && match ?
                (<UmpireControls
                    trackScore={trackScore}
                    name={teamDetails.name}
                    runs={runs}
                    wickets={wickets}
                    overs={oversCompleted} />)
                :
                null
            }
        </div>
    );
}