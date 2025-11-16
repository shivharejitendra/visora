// server/controllers/userController.js
import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import transactionModel from "../models/transactionModel.js";
import crypto from "crypto";

// =============== AUTH ===============

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing Details" });
    }

    const existing = await userModel.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      success: true,
      token,
      user: { name: user.name, id: user._id },
    });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and Password are required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    return res.json({
      success: true,
      token,
      user: { name: user.name, id: user._id },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============== CREDITS ===============

const userCredits = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Missing token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token" });
    }

    const user = await userModel
      .findById(decoded.id)
      .select("name email credits");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      credits: user.credits || 0,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits || 0,
      },
    });
  } catch (error) {
    console.error("userCredits error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

// =============== RAZORPAY SETUP ===============

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =============== CREATE ORDER ===============

/**
 * POST /api/user/pay-razor
 * Expects: { planId: 'Basic' } in body
 * Auth: Authorization: Bearer <token>
 */
const paymentRazorpay = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    let userIdFromToken = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userIdFromToken = decoded?.id;
      } catch (err) {
        console.warn("Invalid JWT:", err.message);
      }
    }

    const planIdRaw = req.body.planId || req.body.plainId;
    const userId = userIdFromToken || req.body.userId;

    if (!userId || !planIdRaw) {
      return res.status(400).json({
        success: false,
        message: "Missing Details: userId or planId",
      });
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const planId = planIdRaw.toString().toLowerCase();
    let credits, plan, amount;

    switch (planId) {
      case "basic":
      case "basic-plan":
      case "basic_plan":
        plan = "Basic";
        credits = 100;
        amount = 10;
        break;
      case "advance":
      case "advanced":
      case "advance-plan":
        plan = "Advance";
        credits = 500;
        amount = 50;
        break;
      case "business":
      case "business-plan":
        plan = "Business";
        credits = 5000;
        amount = 250;
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Plan not found" });
    }

    const date = Date.now();

    // Create transaction entry (credits NOT added yet)
    const newTransaction = await transactionModel.create({
      userId,
      plan,
      amount,
      credits,
      date,
      status: "created",
    });

    const options = {
      amount: amount * 100, // paise
      currency: process.env.CURRENCY || "INR",
      receipt: newTransaction._id.toString(),
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(options);

    // Save Razorpay order id in transaction
    newTransaction.razorpayOrderId = order.id;
    await newTransaction.save();

    return res.json({
      success: true,
      order,
      transactionId: newTransaction._id,
    });
  } catch (error) {
    console.error("paymentRazorpay error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

// =============== VERIFY PAYMENT & ADD CREDITS ===============

/**
 * POST /api/user/verify-payment
 * Body: {
 *  razorpay_payment_id,
 *  razorpay_order_id,
 *  razorpay_signature,
 *  transactionId
 * }
 */
const verifyRazorpay = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      transactionId,
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay verification details",
      });
    }

    // 1) Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // 2) Find transaction
    const transaction = await transactionModel.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.paymentVerified) {
      return res.json({
        success: false,
        message: "Payment already processed",
      });
    }

    // 3) Find user
    const user = await userModel.findById(transaction.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 4) Add credits
    user.credits = (user.credits || 0) + (transaction.credits || 0);
    await user.save();

    // 5) Update transaction
    transaction.paymentVerified = true;
    transaction.status = "paid";
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    await transaction.save();

    return res.json({
      success: true,
      message: "Payment verified — credits added",
      credits: user.credits,
    });
  } catch (error) {
    console.error("verifyRazorpay error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  registerUser,
  loginUser,
  userCredits,
  paymentRazorpay,
  verifyRazorpay,
};
