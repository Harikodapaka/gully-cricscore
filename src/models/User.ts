import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
    email: string;
    name: string;
    role: "admin" | "umpire" | "spectator";
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "umpire", "spectator"], default: "spectator" },
    createdAt: { type: Date, default: Date.now },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;