'use client';

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { TeamScore } from './TeamScore';
import { MatchResult } from './MatchResult';
import { MatchInfo } from './MatchInfo';
import { IMatchPopulated } from '@/models/Match';


interface MatchCardProps {
    match: IMatchPopulated;
}

export default function MatchCard({ match }: MatchCardProps) {
    if (!match) return null;

    const teamNamesMap = match?.teams?.reduce((acc, team) => {
        acc[String(team._id)] = team.name;
        return acc;
    }, {} as Record<string, string>);

    const teamA = {
        name: match.innings?.[0]?.battingTeamId.name || 'Team A',
        runs: match.innings?.[0]?.score || 0,
        wickets: match.innings?.[0]?.wickets || 0,
        oversCompleted: match.innings?.[0]?.oversCompleted || 0,
        batting: match.status === 'in-progress' && match.currentInnings === 1
    };

    const teamB = {
        name: match.innings?.[0]?.bowlingTeamId.name || 'Team B',
        runs: match.innings?.[1]?.score || 0,
        wickets: match.innings?.[1]?.wickets || 0,
        oversCompleted: match.innings?.[1]?.oversCompleted || 0,
        batting: match.status === 'in-progress' && match.currentInnings === 2
    };

    const isInProgress = match.status === 'in-progress';
    const winner = match.wonBy ? teamNamesMap[match.wonBy] : null;
    const isTied = match.status === 'completed' && match.innings?.[1]?.score === match.innings?.[0]?.score;

    return (
        <div className="block relative rounded-md border border-gray-300 shadow-sm my-4">
            <div className="p-4 pb-2">
                <StatusBadge isInProgress={isInProgress} />

                <TeamScore
                    name={teamA.name}
                    runs={teamA.runs}
                    wickets={teamA.wickets}
                    overs={teamA.oversCompleted?.toString()}
                    batting={teamA.batting}
                />

                <TeamScore
                    name={teamB.name}
                    runs={teamB.runs}
                    wickets={teamB.wickets}
                    overs={teamB.oversCompleted?.toString()}
                    batting={teamB.batting}
                    hasBorder
                />
                <div className='my-2'>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-300">
                        Total overs: {match.overs} / Players per team: {match.teams?.[0]?.numberOfPlayers || 0}
                    </p>
                </div>
                <MatchResult winner={winner} isTied={isTied} />
            </div>

            <MatchInfo
                date={new Date(match.createdAt).toLocaleDateString()}
                venue={match.location}
            />
        </div>
    );
}
