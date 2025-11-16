// src/pages/BuyCredits.jsx
import React, { useContext, useState } from "react";
import { assets, plans } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";

const BuyCredits = () => {
  const { user, backendUrl, loadCreditsData, token, setShowLogin } =
    useContext(AppContext);

  const [loadingPlanId, setLoadingPlanId] = useState(null);

  const getAuthHeaders = () =>
    token ? { Authorization: `Bearer ${token}` } : {};

  // Open Razorpay checkout
  const initPay = (order, transactionId, planId) => {
    try {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Credits Payment",
        order_id: order.id,

        handler: async (response) => {
          console.log("razorpay handler response:", response);

          try {
            const verifyRes = await axios.post(
              `${backendUrl}/api/user/verify-payment`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                transactionId,
              },
              { headers: getAuthHeaders() }
            );

            console.log("verify response:", verifyRes.data);

            if (verifyRes.data.success) {
              toast.success("Payment verified — credits added!");
              await loadCreditsData?.();
            } else {
              toast.error(verifyRes.data.message || "Verification failed");
            }
          } catch (err) {
            console.error("verification error", err);
            toast.error(
              err?.response?.data?.message ||
                err.message ||
                "Verification failed"
            );
          } finally {
            setLoadingPlanId(null);
          }
        },

        prefill: {
          email: user?.email || "",
          name: user?.name || "",
        },

        theme: { color: "#111827" },

        modal: {
          ondismiss: function () {
            toast.info("Payment cancelled");
            setLoadingPlanId(null);
          },
        },
      };

      if (!window.Razorpay) {
        toast.error("Payment SDK not loaded. Try again later.");
        setLoadingPlanId(null);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        toast.error("Payment failed");
        setLoadingPlanId(null);
      });
      rzp.open();
    } catch (err) {
      console.error("initPay error", err);
      toast.error(err?.message || "Failed to initiate payment");
      setLoadingPlanId(null);
    }
  };

  const paymentRazorpay = async (planId) => {
    console.log("purchase clicked for plan:", planId);

    if (loadingPlanId) return;

    if (!user) {
      setShowLogin(true);
      return;
    }

    setLoadingPlanId(planId);

    try {
      const headers = {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      };

      const { data } = await axios.post(
        `${backendUrl}/api/user/pay-razor`,
        { planId },
        { headers }
      );

      console.log("pay-razor response:", data);

      if (data.success && data.order && data.transactionId) {
        initPay(data.order, data.transactionId, planId);
      } else {
        toast.error(data.message || "Could not create order");
        setLoadingPlanId(null);
      }
    } catch (error) {
      console.error("payment Razorpay error", error);
      toast.error(
        error?.response?.data?.message || error.message || "Payment error"
      );
      setLoadingPlanId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0.2, y: 100 }}
      transition={{ duration: 0.8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="min-h-screen text-center pt-14 mb-10 px-4"
    >
      <button className="border border-gray-400 px-10 py-2 rounded-full mb-6">
        Our Plans
      </button>

      <h1 className="text-3xl font-semibold sm:mb-10 mb-6">
        Choose the Plan
      </h1>

      <div className="flex flex-wrap justify-center gap-6">
        {plans.map((item, index) => (
          <div
            key={index}
            className="w-full sm:w-[300px] bg-white drop-shadow-sm border rounded-xl py-10 px-6
            text-gray-700 hover:scale-105 transition-all duration-500"
          >
            <div className="flex justify-center mb-4">
              <img width={50} src={assets.logo_icon} alt="plan_icon" />
            </div>

            <p className="text-xl font-semibold mb-1">{item.id}</p>
            <p className="text-sm opacity-80">{item.desc}</p>

            <p className="mt-6 mb-6 text-xl font-medium">
              ${item.price}{" "}
              <span className="text-sm opacity-70">
                / {item.credits} credits
              </span>
            </p>

            <button
              onClick={() => paymentRazorpay(item.id)}
              disabled={loadingPlanId === item.id}
              className="w-full bg-gray-900 text-white text-sm py-3 rounded-lg"
            >
              {loadingPlanId === item.id
                ? "Processing..."
                : user
                ? "Purchase"
                : "Get Started"}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default BuyCredits;
