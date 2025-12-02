import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// -------------------------------------------
// 🔥 Middleware
// -------------------------------------------

// Increase limit for image upload (fix 413 error)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

// -------------------------------------------
// 🔥 Routes
// -------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// -------------------------------------------
// 🔥 Serve Frontend (Production Mode)
// -------------------------------------------
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");

  app.use(express.static(frontendPath));

  // Updated syntax (Fix path-to-regexp error)
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// -------------------------------------------
// 🔥 Start Server
// -------------------------------------------
server.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
  connectDB();
});
