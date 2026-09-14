const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Journal = require("../models/Journal");
const { generateSpiritualGuidance } = require("../services/spiritualAI");

const CONSULTATION_COST = 9;

/**
 * POST /api/ask or /api/guidance
 * Accepts question/problem, tradition/religion, and optional userId.
 * Verifies walletBalance >= 9, deducts ₹9, saves to Journal, returns answer.
 */
router.post("/", async (req, res) => {
  try {
    const { userId, question, problem, tradition, religion } = req.body;
    const promptText = (question || problem || "").trim();
    const selectedTradition = tradition || religion || "gita";

    if (!promptText) {
      return res.status(400).json({ error: "Please share what's on your mind or in your heart." });
    }

    // Resolve user (or auto-dev user)
    let user;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.findOne({ googleId: "dev_seeker_108" });
      if (!user) {
        user = await User.create({
          googleId: "dev_seeker_108",
          email: "seeker@spiritualhelper.io",
          name: "Enlightened Seeker",
          walletBalance: 18,
        });
      }
    }

    // 402 Error check for wallet balance
    if (user.walletBalance < CONSULTATION_COST) {
      return res.status(402).json({
        error: `Insufficient wallet balance. You need at least ₹${CONSULTATION_COST} to seek spiritual guidance.`,
        requiredBalance: CONSULTATION_COST,
        currentBalance: user.walletBalance,
        needsTopUp: true,
      });
    }

    // Deduct ₹9 atomically
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { walletBalance: -CONSULTATION_COST } },
      { new: true }
    );

    // AI / Scripture Generation
    let aiResponse;
    try {
      aiResponse = await generateSpiritualGuidance(promptText, selectedTradition);
    } catch (aiErr) {
      // Refund if error occurs
      await User.findByIdAndUpdate(user._id, { $inc: { walletBalance: CONSULTATION_COST } });
      return res.status(500).json({
        error: "Guidance channel momentarily disturbed. ₹9 refunded. Please try again.",
      });
    }

    // Persist to Journal
    const journalEntry = await Journal.create({
      userId: user._id,
      question: promptText,
      tradition: aiResponse.tradition || selectedTradition,
      aiResponse,
      timestamp: new Date(),
    });

    return res.json({
      success: true,
      religion: aiResponse.tradition || selectedTradition,
      ...aiResponse,
      answer: aiResponse,
      walletBalance: updatedUser.walletBalance,
      journalId: journalEntry._id,
      deducted: CONSULTATION_COST,
    });
  } catch (error) {
    console.error("[Ask/Guidance] Error:", error);
    return res.status(500).json({
      error: "An unexpected error occurred while consulting the spiritual guide.",
      details: error.message,
    });
  }
});

module.exports = router;
