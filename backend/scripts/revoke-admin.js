/**
 * Revoke a user's admin access IMMEDIATELY.
 *
 *   node scripts/revoke-admin.js someone@example.com
 *
 * Clears the admin flags and bumps the user's tokenVersion, which invalidates
 * every session they currently hold (admin checks already read the database on
 * each request; this also ends the session outright).
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

async function main() {
  const email = (process.argv[2] || "").toLowerCase().trim();
  if (!email) {
    console.error("Usage: node scripts/revoke-admin.js <email>");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await User.updateMany(
    { email },
    { $set: { isAdmin: false, role: "user" }, $inc: { tokenVersion: 1 } }
  );
  console.log(`Matched ${result.matchedCount} account(s) for ${email}; admin access revoked and sessions invalidated.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
