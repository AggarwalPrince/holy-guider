const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Razorpay = require("razorpay");
const User = require("../models/User");

// Initialize Razorpay client with fallback for dev testing
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder_key_id";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key";
  return new Razorpay({ key_id, key_secret });
};

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for wallet top-up (minimum ₹9)
 */
router.post("/create-order", async (req, res) => {
  try {
    const { amount, userId } = req.body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 9) {
      return res.status(400).json({
        error: "Minimum top-up amount is ₹9.",
        minAmount: 9,
      });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is required to create order." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    // If keys are placeholder/missing, return simulated order for seamless testing
    if (!key_id || key_id.includes("placeholder") || !key_secret || key_secret.includes("placeholder")) {
      const mockOrderId = `order_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      return res.json({
        success: true,
        order_id: mockOrderId,
        amount: parsedAmount * 100, // in paise
        currency: "INR",
        key: key_id || "rzp_test_placeholder_key_id",
        isSimulated: true,
      });
    }

    const razorpay = getRazorpayInstance();
    const options = {
      amount: Math.round(parsedAmount * 100), // Razorpay expects paise
      currency: "INR",
      receipt: `rcpt_${userId.toString().slice(-6)}_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        purpose: "Spiritual AI Consultation Wallet Top-Up",
      },
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[Payments] Order creation error:", error);
    return res.status(500).json({
      error: "Could not create payment order.",
      details: error.message,
    });
  }
});

/**
 * POST /api/payments/verify
 * Verifies Razorpay HMAC SHA256 signature and credits the user's walletBalance
 */
router.post("/verify", async (req, res) => {
  try {
    const {
      userId,
      amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!userId || !amount || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        error: "Missing required payment verification parameters.",
      });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Invalid recharge amount." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const isMock = razorpay_order_id.startsWith("order_sim_") || !key_secret || key_secret.includes("placeholder");

    if (!isMock) {
      // Standard Razorpay HMAC SHA256 signature verification
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(body.toString())
        .digest("hex");

      const isSignatureValid = expectedSignature === razorpay_signature;

      if (!isSignatureValid) {
        console.error("[Payments] Signature mismatch! Expected:", expectedSignature, "Received:", razorpay_signature);
        return res.status(400).json({
          error: "Invalid payment signature verification. Transaction rejected.",
        });
      }
    }

    // Atomically increment user's walletBalance
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: parsedAmount } },
      { new: true, runValidators: true }
    );

    console.log(
      `[Payments] Successfully credited ₹${parsedAmount} to user ${user.email}. New balance: ₹${updatedUser.walletBalance}`
    );

    return res.json({
      success: true,
      message: `₹${parsedAmount} successfully added to your wallet.`,
      paymentId: razorpay_payment_id,
      walletBalance: updatedUser.walletBalance,
      creditedAmount: parsedAmount,
    });
  } catch (error) {
    console.error("[Payments] Verification error:", error);
    return res.status(500).json({
      error: "Payment verification failed.",
      details: error.message,
    });
  }
});

module.exports = router;
