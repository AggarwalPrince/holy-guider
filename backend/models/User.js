const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    // Not unique on purpose: identity is googleId, and a unique index here
    // would fail to build on an existing database that already has duplicate
    // emails. It is indexed because admin promotion / grants look users up by it.
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: "Seeker",
      maxlength: 200,
    },
    avatar: {
      type: String,
      default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      maxlength: 2048,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    // Guest sessions are off by default and are not allowed to use /api/ask.
    isGuest: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Bumping this number instantly invalidates every session token issued
    // for this user (used when revoking admin access — see scripts/revoke-admin.js).
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
