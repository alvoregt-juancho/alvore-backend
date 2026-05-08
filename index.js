const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");

// Custom Modules
const { dbConnect } = require("./Config/dbConnect.js");
const routes = require("./app.js");
const { handleSocketConnection } = require("./Utills/SocketHelper.js");

dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = process.env.PORT || 3000;

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://alvora.softwaredemolive.live"
];

// CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const server = http.createServer(app);

// Socket.IO CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// DB Connect
dbConnect();

// Middlewares
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Socket.IO
handleSocketConnection(io);

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 Alvore Backend is Working! 🎉");
});

// API Routes
app.use(routes);

// Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
