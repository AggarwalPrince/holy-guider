const express = require("express");
const router = express.Router();
const Journal = require("../models/Journal");
const { requireUser } = require("../middleware/auth");
const { isObjectIdString } = require("../utils/validate");

/**
 * GET /api/journal/:userId — your own journal, or anyone's if you are
 * CURRENTLY an admin. requireUser re-reads the user from the database on every
 * request, so req.user.isAdmin can't be a stale token claim: a demoted admin
 * loses this access on their very next request.
 */
router.get("/:userId", requireUser, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isObjectIdString(userId)) {
      return res.status(400).json({ error: "Invalid user id." });
    }
    if (req.user.id !== userId) {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "You can only view your own journal." });
      }
      console.warn(`[Audit] Admin ${req.user.id} read the journal of user ${userId}`);
    }

    const entries = await Journal.find({ userId }).sort({ timestamp: -1 }).limit(50);
    return res.json({ success: true, entries });
  } catch (error) {
    console.error("[Journal] Error retrieving entries:", error);
    return res.status(500).json({ error: "Failed to fetch spiritual journal entries." });
  }
});

/** DELETE /api/journal/:journalId — own entries only (admins may delete any). */
router.delete("/:journalId", requireUser, async (req, res) => {
  try {
    const { journalId } = req.params;
    if (!isObjectIdString(journalId)) {
      return res.status(400).json({ error: "Invalid journal id." });
    }

    // Ownership is part of the delete filter itself, so there is no window
    // between "check owner" and "delete".
    const filter = req.user.isAdmin ? { _id: journalId } : { _id: journalId, userId: req.user.id };
    const deleted = await Journal.findOneAndDelete(filter);

    if (!deleted) {
      // Same answer whether it doesn't exist or belongs to someone else, so
      // entry ids can't be probed.
      return res.status(404).json({ error: "Journal entry not found." });
    }
    if (deleted.userId.toString() !== req.user.id) {
      console.warn(`[Audit] Admin ${req.user.id} deleted journal entry ${journalId} of user ${deleted.userId}`);
    }
    return res.json({ success: true, message: "Journal entry deleted." });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete entry." });
  }
});

module.exports = router;
