'use client';

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { TeamScore } from './TeamScore';
import { MatchResult } from './MatchResult';
import { MatchInfo } from './MatchInfo';

interface Team {
    _id: string;
    name: string;
    numberOfPlayers: number;
}

interface Innings {
    inningsNumber: number;
    score: number;
    wickets: number;
    oversCompleted: string;

}

interface MatchData {
    _id: string;
    location: string;
    overs: number;
    status: 'in-progress' | 'completed';
    currentInnings: number;
    teams: Team[];
    innings: Innings[];
    createdAt: string;
}

interface MatchCardProps {
    match: MatchData;
}

export default function MatchCard({ match }: MatchCardProps) {
    if (!match) return null;

    const teamA = {
        name: match.teams?.[0]?.name || 'Team A',
        runs: match.innings?.[0]?.score || 0,
        wickets: match.innings?.[0]?.wickets || 0,
        oversCompleted: match.innings?.[0]?.oversCompleted || 0,
    };

    const teamB = {
        name: match.teams?.[1]?.name || 'Team B',
        runs: match.innings?.[1]?.score || 0,
        wickets: match.innings?.[1]?.wickets || 0,
        oversCompleted: match.innings?.[1]?.oversCompleted || 0
    };

    const isInProgress = match.status === 'in-progress';
    const winner =
        !isInProgress && teamA.runs !== teamB.runs
            ? teamA.runs > teamB.runs
                ? teamA.name
                : teamB.name
            : null;

    return (
        <div className="block relative rounded-md border border-gray-300 shadow-sm my-4">
            <div className="p-4 pb-2">
                <StatusBadge isInProgress={isInProgress} />

                <TeamScore
                    name={teamA.name}
                    runs={teamA.runs}
                    wickets={teamA.wickets}
                    overs={teamA.oversCompleted?.toString()}
                />

                <TeamScore
                    name={teamB.name}
                    runs={teamB.runs}
                    wickets={teamB.wickets}
                    overs={teamB.oversCompleted?.toString()}
                    hasBorder
                />
                <div className='my-2'>
                    <p className='text-xs font-medium text-gray-500'>
                        Total overs: {match.overs} / Players per team: {match.teams?.[0]?.numberOfPlayers || 0}
                    </p>
                </div>
                <MatchResult winner={winner} />
            </div>

            <MatchInfo
                date={new Date(match.createdAt).toLocaleDateString()}
                venue={match.location}
            />
        </div>
    );
}
