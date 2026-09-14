require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (MongoDB Atlas URI or local in-memory fallback)
connectDB();

// Global Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Keep-Alive Endpoint for UptimeRobot / Render prevent-sleep pinging
app.get("/keep-alive", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Celestial server is awake and radiating positive energy.",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Mount Core API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/ask", require("./routes/ask"));
app.use("/api/guidance", require("./routes/ask")); // Alias for backward compatibility
app.use("/api/journal", require("./routes/journal"));

// --- Production Static Assets & SPA Routing ---
// If frontend has been built into frontend/dist, serve it directly so the app can be deployed as 1 single service!
const frontendDistPath = path.join(__dirname, "../frontend/dist");

if (fs.existsSync(frontendDistPath)) {
  console.log(`📦 [Production] Serving frontend static assets from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  // Client-side SPA routing fallback (returns index.html for /home, /result, /journal, etc.)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/keep-alive") {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  // If hosted separately (e.g. frontend on Vercel), provide helpful root response
  app.get("/", (req, res) => {
    res.json({
      name: "Holy Guider API",
      status: "active",
      keepAlive: "/keep-alive",
      routes: {
        auth: "/api/auth",
        payments: "/api/payments",
        ask: "/api/ask",
        journal: "/api/journal",
      },
    });
  });

  // Fallback 404 handler for API routes
  app.use((req, res) => {
    res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
  });
}

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error("[ServerError]", err.stack || err);
  res.status(500).json({
    error: "A cosmic disturbance occurred on the server.",
    message: err.message,
  });
});

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✨ Spiritual AI Backend listening peacefully on port ${PORT}`);
    console.log(`🕊️  Keep-alive monitor ready at http://localhost:${PORT}/keep-alive`);
  });
}

module.exports = app;
