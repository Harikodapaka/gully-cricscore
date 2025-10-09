import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IInnings extends Document {
    inningsNumber: 1 | 2;
    battingTeamId: Types.ObjectId;
    bowlingTeamId: Types.ObjectId;
    score: number;
    wickets: number;
    status: "in-progress" | "completed";
    startedAt: Date;
    completedAt?: Date;
}

export interface IPopulatedInnings extends Omit<IInnings, 'battingTeamId' | 'bowlingTeamId'> {
    oversCompleted: string;
    battingTeamId: any;
    bowlingTeamId: any;
}

const InningsSchema = new Schema<IInnings>({
    inningsNumber: { type: Number, enum: [1, 2], required: true },
    battingTeamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    bowlingTeamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    score: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    status: { type: String, enum: ["in-progress", "completed"], default: "in-progress" },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
});

const Innings: Model<IInnings> = mongoose.models.Innings || mongoose.model<IInnings>("Innings", InningsSchema);

export default Innings;