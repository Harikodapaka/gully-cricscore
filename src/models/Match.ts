import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { ITeam } from "./Team";
import { IInningsPopulated } from "./Innings";

export interface IMatch extends Document {
    location: string;
    overs: number;
    status: "in-progress" | "completed";
    currentInnings: 1 | 2;
    createdAt: Date;
    completedAt?: Date;
    teams: Types.ObjectId[];
    innings: Types.ObjectId[];
    wonBy?: Types.ObjectId;
    winnerMessage?: string;
}

export interface IMatchPopulated extends Omit<IMatch, 'teams' | 'innings' | 'wonBy'> {
    teams: ITeam[];
    innings: IInningsPopulated[];
    wonBy?: string;
}

const MatchSchema = new Schema<IMatch>({
    location: { type: String, required: true },
    overs: { type: Number, required: true },
    status: { type: String, enum: ["in-progress", "completed"], default: "in-progress" },
    currentInnings: { type: Number, enum: [1, 2], default: 1 },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    teams: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    innings: [{ type: Schema.Types.ObjectId, ref: "Innings" }],
    wonBy: { type: Schema.Types.ObjectId, ref: "Team" },
    winnerMessage: { type: String }
});

const Match: Model<IMatch> = mongoose.models.Match || mongoose.model<IMatch>("Match", MatchSchema);

export default Match;