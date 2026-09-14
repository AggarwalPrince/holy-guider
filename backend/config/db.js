const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/spiritual_ai_db";
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`✨ [MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB] Connection to '${uri}' timed out. Initializing in-memory dev database...`);
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      const memConn = await mongoose.connect(memUri);
      console.log(`🕊️  [MongoDB] Zero-config In-Memory Database active. All models, wallet balances, and journals will persist during this session.`);
    } catch (memErr) {
      console.error(`[MongoDB] Could not start in-memory database: ${memErr.message}`);
      console.log(`💡 Tip: Set MONGODB_URI in backend/.env to connect to your MongoDB Atlas cluster or local mongod.`);
    }
  }
};

module.exports = connectDB;
