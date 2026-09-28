require("dotenv").config();
const { validateEnv } = require("./config/env");
validateEnv(); // exits with a clear message on unsafe production config

const connectDB = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 5000;

process.on("unhandledRejection", (reason) => {
  console.error("[UnhandledRejection]", reason);
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✨ Spiritual AI Backend listening peacefully on port ${PORT}`);
  });
}

start();
