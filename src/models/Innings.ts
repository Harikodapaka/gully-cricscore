import "./Team"; // Ensure Team schema is registered
import mongoose, {
  type Document,
  type Model,
  Schema,
  type Types,
} from "mongoose";
import type { IBall } from "./Ball";
import type { ITeam } from "./Team";

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

export interface IInningsPopulated
  extends Omit<IInnings, "battingTeamId" | "bowlingTeamId"> {
  oversCompleted: string;
  // Populated fields can be either the raw ObjectId (unpopulated) or the full document
  battingTeamId: ITeam | Types.ObjectId;
  bowlingTeamId: ITeam | Types.ObjectId;
  balls?: IBall[];
}

const InningsSchema = new Schema<IInnings>({
  inningsNumber: { type: Number, enum: [1, 2], required: true },
  battingTeamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
  bowlingTeamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
  score: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["in-progress", "completed"],
    default: "in-progress",
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

// Add indexes for better query performance
InningsSchema.index({ status: 1, inningsNumber: 1 }); // For filtering active innings

const Innings: Model<IInnings> =
  mongoose.models.Innings || mongoose.model<IInnings>("Innings", InningsSchema);

export default Innings;
