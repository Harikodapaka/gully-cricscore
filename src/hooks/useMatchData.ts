'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IMatchPopulated } from '@/models/Match';
import { ITeam } from '@/models/Team';
import { IInningsPopulated } from '@/models/Innings';
import { IBall } from '@/models/Ball';
import { formatOversCompleted } from '@/app/utils/formatOversCompleted';
import { matchApi } from '@/services/matchApi';
import { showToast } from '@/utils/toast';

export interface ScoreState {
    runs: number;
    wickets: number;
    oversCompleted: string;
}

export interface UseMatchDataReturn {
    match: IMatchPopulated | undefined;
    teamDetails: ITeam | undefined;
    inningsData: IInningsPopulated | undefined;
    scoreState: ScoreState;
    lastBallSaved: IBall | null;
    loading: boolean;
    setScoreState: React.Dispatch<React.SetStateAction<ScoreState>>;
    setLastBallSaved: React.Dispatch<React.SetStateAction<IBall | null>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    fetchMatchData: () => Promise<void>;
}

export function useMatchData(matchId: string | string[] | undefined): UseMatchDataReturn {
    const router = useRouter();

    const [match, setMatch] = useState<IMatchPopulated>();
    const [teamDetails, setTeamDetails] = useState<ITeam>();
    const [inningsData, setInningsData] = useState<IInningsPopulated>();
    const [scoreState, setScoreState] = useState<ScoreState>({
        runs: 0,
        wickets: 0,
        oversCompleted: '0.0',
    });
    const [lastBallSaved, setLastBallSaved] = useState<IBall | null>(null);
    const [loading, setLoading] = useState(false);

    const isFetchingRef = useRef(false);

    const fetchMatchData = useCallback(async () => {
        if (!matchId || isFetchingRef.current) return;

        isFetchingRef.current = true;
        setLoading(true);

        try {
            const matchData = await matchApi.fetchMatchDetails(matchId);
            const fetchedMatch = matchData.data;

            setMatch(fetchedMatch);

            const currentInningsIndex = (fetchedMatch.currentInnings ?? 1) - 1;
            const currentInnings = fetchedMatch.innings[currentInningsIndex];

            setInningsData(currentInnings);

            const battingTeam = fetchedMatch.teams.find(
                (t: ITeam) => t._id === currentInnings.battingTeamId
            );

            setTeamDetails(battingTeam);
            setScoreState({
                runs: currentInnings.score || 0,
                wickets: currentInnings.wickets || 0,
                oversCompleted: formatOversCompleted(currentInnings.oversCompleted),
            });

            const lastBall = currentInnings?.balls?.length > 0
                ? currentInnings.balls[0]
                : null;
            setLastBallSaved(lastBall);
        } catch (error) {
            console.error('Error fetching match:', error);
            setMatch(undefined);
            showToast('Error fetching match', 'error');
            router.push('/');
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [matchId, router]);

    return {
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
    };
}

