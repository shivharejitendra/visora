// server/models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  credits: { type: Number, default: 5 }, // starting credits
});

const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);

export default UserModel;
