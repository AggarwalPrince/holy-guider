const express = require("express");
const router = express.Router();
const Journal = require("../models/Journal");

/**
 * GET /api/journal/:userId
 * Retrieves past questions and AI spiritual answers for a given user
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const entries = await Journal.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50);

    return res.json({
      success: true,
      entries,
    });
  } catch (error) {
    console.error("[Journal] Error retrieving entries:", error);
    return res.status(500).json({ error: "Failed to fetch spiritual journal entries." });
  }
});

/**
 * DELETE /api/journal/:journalId
 * Remove a specific journal entry
 */
router.delete("/:journalId", async (req, res) => {
  try {
    const { journalId } = req.params;
    await Journal.findByIdAndDelete(journalId);
    return res.json({ success: true, message: "Journal entry deleted." });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete entry." });
  }
});

module.exports = router;
