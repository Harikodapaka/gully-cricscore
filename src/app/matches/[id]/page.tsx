'use client'

import { TabSwitcher } from "@/components/TabSwitcher";
import { TeamScore } from "@/components/TeamScore";
import { getRunMessage, getRunsIcon } from "./utils";
import { OVERS_TO_DISPLAY } from "./constants";
import { BlueBtn, CardBase, PageContainer } from "@/components/Styles";


interface TeamData {
    name: string;
    runs: number;
    wickets: number;
    overs: number;
}

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
    teamA: TeamData;
    teamB: TeamData;
}) => (
    <div className={`${CardBase} h-24 flex items-center justify-around`}>
        <TeamScore
            name={teamA.name}
            runs={teamA.runs}
            wickets={teamA.wickets}
            overs={teamA.overs.toString()}
        />
        <p className="font-bold">VS</p>
        <TeamScore
            name={teamB.name}
            runs={teamB.runs}
            wickets={teamB.wickets}
            overs={teamB.overs.toString()}
        />
    </div>
);

export default function MatchDetails() {
    const teamA: TeamData = {
        name: "Team A *",
        runs: 123,
        wickets: 4,
        overs: 5.6
    };

    const teamB: TeamData = {
        name: "Team B",
        runs: 0,
        wickets: 0,
        overs: 0
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