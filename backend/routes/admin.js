const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Journal = require("../models/Journal");
const { requireAdmin } = require("../middleware/auth");

// Admin status is established exclusively by requireAdmin: a signed session
// whose user is re-read from the database on every request and must CURRENTLY
// be an admin.

/** GET /api/admin/stats — dashboard overview. */
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalInquiries = await Journal.countDocuments();
    const recent = await Journal.find().sort({ createdAt: -1 }).limit(15);
    const adminUsers = await User.find({ isAdmin: true }).select("email name role createdAt");

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalInquiries,
        activeAdmins: adminUsers.length,
        systemStatus: "healthy",
        database: "connected",
      },
      // Data minimisation: people confide personal problems here. The
      // dashboard gets a short preview, not the full question and the full
      // AI answer; reading a whole entry is an audited action on /api/journal.
      recentInquiries: recent.map((j) => ({
        id: j._id,
        userId: j.userId,
        tradition: j.tradition,
        questionPreview: String(j.question || "").slice(0, 120),
        createdAt: j.createdAt || j.timestamp,
      })),
      adminUsers,
    });
  } catch (error) {
    console.error("[Admin] Stats error:", error);
    return res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

module.exports = router;
