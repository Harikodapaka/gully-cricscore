'use client'

import { TabSwitcher } from "@/components/TabSwitcher";
import { TeamScore, TeamScoreProps } from "@/components/TeamScore";
import { getRunMessage, getRunsIcon } from "./utils";
import { OVERS_TO_DISPLAY } from "./constants";
import { BlueBtn, CardBase, PageContainer } from "@/components/Styles";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { IMatchPopulated } from "@/models/Match";
import LoadingOverlay from "@/components/LoadingOverlay";


const Divider = ({ over }: { over: number }) => (
    <div className="flex items-center">
        <span className="h-px flex-1 bg-gray-300" />
        <span className="shrink-0 px-4 text-gray-900">Over - {over}</span>
        <span className="h-px flex-1 bg-gray-300" />
    </div>
);

const BallDisplay = ({
    ballNumber,
    runs,
    overNumber
}: {
    ballNumber: number;
    runs: number | string;
    overNumber: number;
}) => (
    <div className="flex gap-3 my-4 items-center">
        <p className="h-8 w-8 bg-orange-400 flex items-center justify-center shrink-0 rounded-full border border-orange-100 text-white font-bold">
            {getRunsIcon(runs)}
        </p>
        <p>{getRunMessage(runs)}</p>
        <p className="h-8 w-14 bg-blue-400 flex items-center justify-center shrink-0 rounded border border-blue-200 text-white ml-auto">
            ({overNumber - 1}.{ballNumber + 1})
        </p>
    </div>
);

const OverDisplay = ({ overNumber }: { overNumber: number }) => (
    <div key={`over-${overNumber}`}>
        <Divider over={overNumber} />
        {[0, 1, 4, 3, 'wide', 'no-ball', 6].map((run, i) => (<BallDisplay
            key={`ball-${overNumber}-${i}`}
            ballNumber={i}
            runs={run}
            overNumber={overNumber}
        />))}
    </div>
);

const ScoreCard = ({
    teamA,
    teamB
}: {
    teamA: TeamScoreProps;
    teamB: TeamScoreProps;
}) => (
    <div className={`${CardBase} h-24 flex items-center justify-around`}>
        <TeamScore
            name={teamA.name}
            runs={teamA.runs}
            wickets={teamA.wickets}
            overs={teamA.overs.toString()}
            batting={teamA.batting}
        />
        <p className="font-bold">VS</p>
        <TeamScore
            name={teamB.name}
            runs={teamB.runs}
            wickets={teamB.wickets}
            overs={teamB.overs.toString()}
            batting={teamB.batting}
        />
    </div>
);

export default function MatchDetails() {
    const [matchData, setMatchData] = useState<IMatchPopulated | null>(null);
    const params = useParams();

    useEffect(() => {
        async function fetchMatch() {
            if (!params?.id) return;
            const res = await fetch(`/api/match/${params.id}/details`);
            if (res.ok) {
                const data = await res.json();
                setMatchData(data.data);
            }
        }
        fetchMatch();
    }, [params?.id]);

    if (!matchData) {
        return <LoadingOverlay />;
    }


    // Find teams by their _id for easy lookup
    const teamsById = matchData.teams.reduce((acc, team) => {
        acc[String(team._id)] = { _id: String(team._id), name: String(team.name) };
        return acc;
    }, {} as Record<string, { _id: string; name: string }>);

    // Get both innings
    const [firstInnings, secondInnings] = matchData.innings;

    // Team A: 1st batting team
    const teamA = {
        name: teamsById[firstInnings?.battingTeamId]?.name || 'Team A',
        runs: firstInnings?.score || 0,
        wickets: firstInnings?.wickets || 0,
        overs: (firstInnings?.oversCompleted ?? 0).toString(),
        batting: matchData.status === 'in-progress' && matchData.currentInnings === 1
    };

    // Team B: 2nd batting team
    const teamB = {
        name: teamsById[secondInnings?.battingTeamId]?.name || 'Team B',
        runs: secondInnings?.score || 0,
        wickets: secondInnings?.wickets || 0,
        overs: (secondInnings?.oversCompleted ?? 0).toString(),
        batting: matchData.status === 'in-progress' && matchData.currentInnings === 2
    };

    const handleTabChange = (index: number, label: string) => {
        console.log('Tab changed:', index, label);
    };

    return (
        <div className={PageContainer}>
            <ScoreCard teamA={teamA} teamB={teamB} />

            <div className="flex justify-center mt-4">
                <TabSwitcher
                    tabs={['1st Innings', '2nd Innings']}
                    onChange={handleTabChange}
                />
            </div>

            <div className="rounded-md border border-gray-300 shadow-sm my-4 p-2">
                {Array.from({ length: OVERS_TO_DISPLAY }, (_, i) => (
                    <OverDisplay key={`over-${i + 1}`} overNumber={i + 1} />
                ))}
            </div>
        </div>
    );
}