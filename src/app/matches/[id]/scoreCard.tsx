import { CardBase } from "@/components/Styles";
import { TeamScore, TeamScoreProps } from "@/components/TeamScore";

export const ScoreCard = ({
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