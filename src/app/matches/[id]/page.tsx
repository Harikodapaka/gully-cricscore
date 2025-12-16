'use client'

import { useEffect, useState, useMemo, useCallback } from "react";
import { TabSwitcher } from "@/components/TabSwitcher";
import { PageContainer } from "@/components/Styles";
import { useParams } from "next/navigation";
import { IMatchPopulated } from "@/models/Match";
import LoadingOverlay from "@/components/LoadingOverlay";
import { ScoreCard } from "./scoreCard";
import { IBall } from "@/models/Ball";
import { InningsDisplay } from "./InningsDisplay";
import { showToast } from "@/utils/toast";
import { MATCH_STATUS, INNINGS } from "@/constants/match";
import { matchApi } from "@/services/matchApi";
import { usePusherMatchUpdates } from "@/hooks/usePusherMatchUpdates";
import { calculateOversCompleted } from "@/app/utils/calculateOversCompleted";

export default function MatchDetails() {
    const [matchData, setMatchData] = useState<IMatchPopulated | null>(null);
    const [selectedInnings, setSelectedInnings] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();

    // Handle score updates from Pusher
    const handleScoreUpdate = useCallback((ball: IBall) => {
        setMatchData((prev) => {
            if (!prev) return null;
            
            const inningsIndex = prev.innings.findIndex(
                (innings) => String(innings._id) === String(ball.inningsId)
            );
            
            if (inningsIndex === -1) {
                // Innings not found, return unchanged
                return prev;
            }
            
            const currentInnings = prev.innings[inningsIndex];
            
            // Create new array with updated innings at the found index
            const updatedInnings = [...prev.innings];
            updatedInnings[inningsIndex] = {
                ...currentInnings,
                // Update runs and wickets based on the new ball
                score: (currentInnings.score || 0) + (ball.runs || 0),
                wickets: ball.isWicket 
                    ? (currentInnings.wickets || 0) + 1 
                    : (currentInnings.wickets || 0),
                // Update overs completed based on the new ball
                oversCompleted: calculateOversCompleted(ball),
                // Add the new ball to the balls array
                balls: [ball, ...(currentInnings?.balls ?? [])],
            };
            
            return { ...prev, innings: updatedInnings };
        });
    }, []);

    // Handle ball deletion from Pusher
    const handleBallDeleted = useCallback((payload: { ballId: string; inningsId: string; runs: number; isWicket: boolean }) => {
        setMatchData((prev) => {
            if (!prev) return null;
            
            const inningsIndex = prev.innings.findIndex(
                (innings) => String(innings._id) === String(payload.inningsId)
            );
            
            if (inningsIndex === -1) {
                // Innings not found, return unchanged
                return prev;
            }
            
            const currentInnings = prev.innings[inningsIndex];
            
            // Remove the deleted ball from the balls array
            const updatedBalls = (currentInnings?.balls ?? []).filter(
                (ball) => String(ball._id) !== payload.ballId
            );
            
            // Get the new last ball to calculate oversCompleted
            const lastBall = updatedBalls.length > 0 ? updatedBalls[0] : null;
            const newOversCompleted = lastBall 
                ? calculateOversCompleted(lastBall)
                : '0.0';
            
            // Create new array with updated innings at the found index
            const updatedInnings = [...prev.innings];
            updatedInnings[inningsIndex] = {
                ...currentInnings,
                // Decrement runs and wickets
                score: Math.max(0, (currentInnings.score || 0) - payload.runs),
                wickets: payload.isWicket 
                    ? Math.max(0, (currentInnings.wickets || 0) - 1)
                    : (currentInnings.wickets || 0),
                // Update overs completed based on the new last ball
                oversCompleted: newOversCompleted,
                // Remove the deleted ball from the balls array
                balls: updatedBalls,
            };
            
            return { ...prev, innings: updatedInnings };
        });
    }, []);

    // Subscribe to Pusher for live updates
    const { isConnected } = usePusherMatchUpdates({
        matchId: params?.id,
        matchStatus: matchData?.status,
        onScoreUpdate: handleScoreUpdate,
        onBallDeleted: handleBallDeleted,
    });

    // Fetch match data
    useEffect(() => {
        if (!params?.id) return;

        async function fetchMatch() {
            if (!params?.id) return;

            setLoading(true);
            setError(null);

            try {
                const data = await matchApi.fetchMatchDetails(params.id);
                setMatchData(data.data);
                // Switch to 2nd innings tab if match is in progress and 2nd innings has started
                if (data.data.currentInnings === INNINGS.SECOND && data.data.status === MATCH_STATUS.IN_PROGRESS) {
                    setSelectedInnings(1);
                }
            } catch (err) {
                console.error('Error fetching match:', err);
                setError("Failed to load match data");
                showToast("Error fetching match", 'error');
            } finally {
                setLoading(false);
            }
        }
        fetchMatch();
    }, [params?.id]);

    // Memoized team lookup map
    const teamsById = useMemo(() => {
        if (!matchData?.teams) return {};
        return matchData.teams.reduce((acc, team) => {
            acc[String(team._id)] = { _id: String(team._id), name: String(team.name) };
            return acc;
        }, {} as Record<string, { _id: string; name: string }>);
    }, [matchData?.teams]);

    // Memoized innings data
    const { firstInnings, secondInnings } = useMemo(() => ({
        firstInnings: matchData?.innings?.[0],
        secondInnings: matchData?.innings?.[1],
    }), [matchData?.innings]);

    // Memoized team data for ScoreCard
    const { teamA, teamB } = useMemo(() => {
        const isInProgress = matchData?.status === MATCH_STATUS.IN_PROGRESS;
        
        return {
            teamA: {
                name: teamsById[firstInnings?.battingTeamId]?.name || 'Team A',
                runs: firstInnings?.score || 0,
                wickets: firstInnings?.wickets || 0,
                overs: (firstInnings?.oversCompleted ?? '').toString(),
                batting: isInProgress && matchData?.currentInnings === INNINGS.FIRST
            },
            teamB: {
                name: teamsById[secondInnings?.battingTeamId]?.name || 'Team B',
                runs: secondInnings?.score || 0,
                wickets: secondInnings?.wickets || 0,
                overs: (secondInnings?.oversCompleted ?? '').toString(),
                batting: isInProgress && matchData?.currentInnings === INNINGS.SECOND
            }
        };
    }, [teamsById, firstInnings, secondInnings, matchData?.status, matchData?.currentInnings]);

    // Tab change handler
    const handleTabChange = useCallback((index: number) => {
        setSelectedInnings(index);
    }, []);

    // Get the currently selected innings data
    const selectedInningsData = useMemo(() => {
        if (selectedInnings === 0) return firstInnings;
        return secondInnings;
    }, [selectedInnings, firstInnings, secondInnings]);

    // Check if 2nd innings tab is selected but hasn't started yet
    const isSecondInningsYetToBat = selectedInnings === 1 && matchData?.currentInnings === INNINGS.FIRST;

    // Loading state
    if (loading) {
        return <LoadingOverlay />;
    }

    // Error state
    if (error || !matchData) {
        return (
            <div className={PageContainer}>
                <div className="text-center text-red-500 py-8 font-semibold">
                    {error || "Failed to load match data"}
                </div>
            </div>
        );
    }

    return (
        <div className={PageContainer}>
            <ScoreCard teamA={teamA} teamB={teamB} />

            {isConnected && (
                <div className="m-3 animate-pulse text-orange-500 font-medium text-right">
                    🔴 Live Updates Enabled
                </div>
            )}

            <div className="flex justify-center mt-4">
                <TabSwitcher
                    tabs={['1st Innings', '2nd Innings']}
                    ativeTab={selectedInnings}
                    onChange={handleTabChange}
                />
            </div>

            <div className="rounded-md border border-gray-300 shadow-sm my-4 p-2">
                {isSecondInningsYetToBat ? (
                    <div className="text-center text-gray-500 py-8 font-semibold">
                        Yet to bat
                    </div>
                ) : (
                    <InningsDisplay
                        balls={selectedInningsData?.balls ?? []}
                        totalOvers={matchData.overs}
                    />
                )}
            </div>
        </div>
    );
}
