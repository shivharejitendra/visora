// server/routes/userRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  userCredits,
  paymentRazorpay,
  verifyRazorpay,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/credits", userCredits);
router.post("/pay-razor", paymentRazorpay);
router.post("/verify-payment", verifyRazorpay);

export default router;

//http://localhost:4000/api/user/register
//http://localhost:4000/api/user/login