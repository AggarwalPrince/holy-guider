const express = require("express");
const router = express.Router();
const Journal = require("../models/Journal");
const { generateSpiritualGuidance } = require("../services/spiritualAI");
const { requireUser } = require("../middleware/auth");
const { askUserLimiter } = require("../middleware/rateLimits");
const { isString } = require("../utils/validate");

const MAX_QUESTION_LENGTH = 2000;
// Consultations are free, but every one costs an AI call, so each account gets
// a rolling 24h allowance (admins are exempt). Override with DAILY_ASK_LIMIT.
const DAILY_ASK_LIMIT = Number(process.env.DAILY_ASK_LIMIT) || 20;

/**
 * POST /api/ask  (also mounted as /api/guidance)
 *
 * Free for signed-in Google accounts. The account is ALWAYS the one in the
 * verified session. Guests cannot ask; each account has a daily allowance.
 */
router.post("/", requireUser, askUserLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const rawQuestion = body.question !== undefined ? body.question : body.problem;
    const rawTradition = body.tradition !== undefined ? body.tradition : body.religion;

    if (rawQuestion !== undefined && typeof rawQuestion !== "string") {
      return res.status(400).json({ error: "Your question must be text." });
    }
    if (rawTradition !== undefined && !isString(rawTradition, { min: 1, max: 50 })) {
      return res.status(400).json({ error: "Please select a valid tradition." });
    }

    const promptText = (rawQuestion || "").trim();
    const selectedTradition = rawTradition || "gita";

    if (!promptText) {
      return res.status(400).json({ error: "Please share what's on your mind or in your heart." });
    }
    if (promptText.length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({
        error: `Please keep your question under ${MAX_QUESTION_LENGTH} characters.`,
        maxLength: MAX_QUESTION_LENGTH,
      });
    }

    if (req.user.isGuest) {
      return res.status(403).json({
        error: "Please sign in with Google to seek guidance.",
        needsSignIn: true,
      });
    }

    // req.user.isAdmin comes from the database on this very request (see
    // middleware/auth.js), not from a token claim.
    if (!req.user.isAdmin) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const usedToday = await Journal.countDocuments({ userId: req.user.id, timestamp: { $gte: since } });
      if (usedToday >= DAILY_ASK_LIMIT) {
        return res.status(429).json({
          error: `You've reached today's limit of ${DAILY_ASK_LIMIT} consultations. Please come back tomorrow.`,
          dailyLimit: DAILY_ASK_LIMIT,
        });
      }
    }

    let aiResponse;
    try {
      aiResponse = await generateSpiritualGuidance(promptText, selectedTradition);
    } catch (aiErr) {
      console.error("[Ask/Guidance] AI Service Error:", aiErr.message);
      return res.status(503).json({
        error: "Sacred AI service temporarily unavailable. Please try again in a moment.",
        supportEmail: "support@holyguider.com",
      });
    }

    // The guidance has been delivered. Failing to store the
    // journal copy must not turn that into an error response.
    let journalId = null;
    try {
      const entry = await Journal.create({
        userId: req.user.id,
        question: promptText,
        tradition: String(aiResponse.tradition || aiResponse.religion || selectedTradition).slice(0, 100),
        aiResponse,
        timestamp: new Date(),
      });
      journalId = entry._id;
    } catch (journalErr) {
      console.error("[Ask/Guidance] Could not save journal entry:", journalErr.message);
    }

    // Server-controlled fields come LAST so nothing in the model's output can
    // overwrite them (and the AI output is whitelisted in spiritualAI.js anyway).
    return res.json({
      ...aiResponse,
      success: true,
      religion: aiResponse.religion || selectedTradition,
      answer: aiResponse,
      journalId,
    });
  } catch (error) {
    console.error("[Ask/Guidance] Error:", error);
    return res.status(500).json({ error: "An unexpected error occurred while consulting the spiritual guide." });
  }
});

module.exports = router;
