import "./Innings"; // Ensure Innings schema is registered
import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IBall extends Document {
    inningsId: Types.ObjectId;
    overNumber: number;
    ballNumber: number;
    runs: number;
    isWicket: boolean;
    isExtra: boolean;
    extraType: "none" | "wide" | "noball";
    timestamp: Date;
}

const BallSchema = new Schema<IBall>({
    inningsId: { type: Schema.Types.ObjectId, ref: "Innings", required: true },
    overNumber: { type: Number, required: true },
    ballNumber: { type: Number, required: true },
    runs: { type: Number, default: 0 },
    isWicket: { type: Boolean, default: false },
    isExtra: { type: Boolean, default: false },
    extraType: { type: String, enum: ["none", "wide", "noball"], default: "none" },
    timestamp: { type: Date, default: Date.now },
});

// Add compound index for better query performance
BallSchema.index({ inningsId: 1, overNumber: -1, ballNumber: -1 });

const Ball: Model<IBall> = mongoose.models.Ball || mongoose.model<IBall>("Ball", BallSchema);

export default Ball;