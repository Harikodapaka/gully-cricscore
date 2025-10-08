import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITeam extends Document {
    name: string;
    numberOfPlayers: number;
    battingOrder: "1st" | "2nd";
}

const TeamSchema = new Schema<ITeam>({
    name: { type: String, required: true },
    numberOfPlayers: { type: Number, default: 11 },
    battingOrder: { type: String, enum: ["1st", "2nd"], required: true },
});

const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);

export default Team;