// server/models/transactionModel.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: String, required: true },
  amount: { type: Number, required: true }, // amount in major currency (e.g. INR)
  credits: { type: Number, required: true },
  date: { type: Date, default: Date.now },

  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created",
  },

  // Razorpay details
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },

  paymentVerified: { type: Boolean, default: false },
});

const TransactionModel =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

export default TransactionModel;
