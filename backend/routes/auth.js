const express = require("express");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google
 * Verify Google ID Token and find/create user
 */
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Google ID token is required." });
    }

    let payload;

    // Verify token with Google if client ID is configured
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "your-google-client-id.apps.googleusercontent.com") {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else {
      // Decode JWT payload for dev or sandbox environments
      const parts = token.split(".");
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      } else {
        payload = {
          sub: `google_user_${Date.now()}`,
          email: "seeker@mysticai.io",
          name: "Enlightened Seeker",
          picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        };
      }
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.create({
        googleId,
        email: email || `user_${googleId}@spiritualai.io`,
        name: name || "Spiritual Seeker",
        avatar: picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        walletBalance: 0,
      });
      console.log(`[Auth] New user created: ${user.email} (${user._id})`);
    } else {
      console.log(`[Auth] Existing user logged in: ${user.email} (${user._id})`);
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        googleId: user.googleId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        walletBalance: user.walletBalance,
      },
    });
  } catch (error) {
    console.error("[Auth] Google sign-in verification error:", error);
    return res.status(401).json({
      error: "Authentication failed. Could not verify Google credentials.",
      details: error.message,
    });
  }
});

/**
 * POST /api/auth/dev-login
 * Instant 1-click test user for immediate development & evaluation
 */
router.post("/dev-login", async (req, res) => {
  try {
    const defaultGoogleId = "dev_seeker_108";
    let user = await User.findOne({ googleId: defaultGoogleId });

    if (!user) {
      user = await User.create({
        googleId: defaultGoogleId,
        email: "dev.seeker@spiritualai.io",
        name: "Cosmic Seeker",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        walletBalance: 18, // Give 2 free consultations for test convenience
      });
      console.log(`[Auth] Created dev user with 18 wallet balance`);
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        googleId: user.googleId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        walletBalance: user.walletBalance,
      },
    });
  } catch (error) {
    console.error("[Auth] Dev login error:", error);
    return res.status(500).json({ error: "Failed to initialize dev account" });
  }
});

/**
 * GET /api/auth/user/:id
 * Fetch latest user profile & wallet balance
 */
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      id: user._id,
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

module.exports = router;
