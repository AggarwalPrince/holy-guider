const mongoose = require("mongoose");

const isProduction = process.env.NODE_ENV === "production";

async function ensureIndexes() {
  // Build the indexes (e.g. unique googleId) BEFORE we accept traffic.
  const models = ["User", "Journal"].map((n) => require(`../models/${n}`));
  await Promise.all(models.map((m) => m.init()));
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/spiritual_ai_db";
  try {
    const conn = await mongoose.connect(uri, {
      // Atlas cold-starts + DNS SRV lookup regularly exceed 2s; a too-tight
      // timeout in production would crash-loop the service on a healthy DB.
      serverSelectionTimeoutMS: isProduction ? 10000 : 2000,
    });
    console.log(`✨ [MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    // In production we fail fast and loud instead of silently swapping in an
    // empty in-memory database (every user would look brand new, with no history). The in-memory fallback exists for local development only.
    if (isProduction) {
      console.error(`[MongoDB] FATAL: could not connect in production: ${error.message}`);
      console.error("[MongoDB] Refusing to fall back to an in-memory database in production. Exiting.");
      process.exit(1);
    }

    console.warn(`[MongoDB] Connection to '${uri}' failed. Initializing in-memory dev database...`);
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const memUri = (await MongoMemoryServer.create()).getUri();
      await mongoose.connect(memUri);
      console.log("🕊️  [MongoDB] In-memory database active (development only). Data will NOT persist.");
    } catch (memErr) {
      console.error(`[MongoDB] Could not start in-memory database: ${memErr.message}`);
      console.log("💡 Tip: set MONGODB_URI in backend/.env to a MongoDB Atlas cluster.");
      return;
    }
  }

  try {
    await ensureIndexes();
  } catch (err) {
    console.error("[MongoDB] Startup checks failed:", err.message);
    if (isProduction) process.exit(1);
  }
};

module.exports = connectDB;
