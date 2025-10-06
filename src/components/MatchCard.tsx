'use client';


import React from 'react';
import { StatusBadge } from './StatusBadge';
import { TeamScore } from './TeamScore';
import { MatchResult } from './MatchResult';
import { MatchInfo } from './MatchInfo';


interface MatchCardProps {
    id: number;
    teamA: {
        name: string;
        runs: number;
        wickets: number;
        overs: number;
    };
    teamB: {
        name: string;
        runs: number;
        wickets: number;
        overs: number;
    };
    date: string;
    venue: string;
    isInProgress?: boolean;
    winner?: string | null;
}

export default function MatchCard({
    id,
    teamA = { name: "Team A *", runs: 123, wickets: 4, overs: 5.6 },
    teamB = { name: "Team B", runs: 0, wickets: 0, overs: 0 },
    date = "2025-01-01",
    venue = "Doon valley park grounds of the kitchener",
    isInProgress = id === 1,
    winner = id === 1 ? null : "Team A"
}: Partial<MatchCardProps> & { id: number }) {
    return (
        <div className="block relative rounded-md border border-gray-300 shadow-sm my-4">
            <div className="p-4 pb-2">
                <StatusBadge isInProgress={isInProgress} />

                <TeamScore
                    name={teamA.name}
                    runs={teamA.runs}
                    wickets={teamA.wickets}
                    overs={teamA.overs}
                />

                <TeamScore
                    name={teamB.name}
                    runs={teamB.runs}
                    wickets={teamB.wickets}
                    overs={teamB.overs}
                    hasBorder
                />

                <MatchResult winner={winner} />
            </div>

            <MatchInfo date={date} venue={venue} />
        </div>
    );
}