import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface ITeam extends Document {
  name: string;
  numberOfPlayers: number;
  battingOrder: "1st" | "2nd";
  players: string[];
}

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  numberOfPlayers: { type: Number, default: 11 },
  battingOrder: { type: String, enum: ["1st", "2nd"], required: true },
  players: { type: [String], default: [] },
});

// Add index for team name searches
TeamSchema.index({ name: 1 });

const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);

export default Team;
