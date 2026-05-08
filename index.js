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

// Load ENV
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("🔑 Loaded ENV Vars:");
console.log("PORT:", process.env.PORT);
console.log(
  "MONGODB_URL:",
  process.env.MONGODB_URL
    ? process.env.MONGODB_URL.slice(0, 30) + "..."
    : "❌ Not Found"
);

const PORT = process.env.PORT || 3000;

const app = express();

/* =========================================================
   CORS CONFIG
========================================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "https://alvora.softwaredemolive.live",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman/mobile apps/etc)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("❌ Not allowed by CORS"));
    }
  },

  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ],

  credentials: true,
};

/* =========================================================
   APPLY CORS BEFORE EVERYTHING
========================================================= */

app.use(cors(corsOptions));

// Handle Preflight Requests
app.options("*", cors(corsOptions));

/* =========================================================
   OTHER MIDDLEWARES
========================================================= */

app.use(morgan("dev"));

app.use(bodyParser.json({ limit: "50mb" }));

app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

app.use(cookieParser());

/* =========================================================
   CREATE SERVER
========================================================= */

const server = http.createServer(app);

/* =========================================================
   SOCKET.IO CONFIG
========================================================= */

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

/* =========================================================
   DATABASE CONNECTION
========================================================= */

dbConnect();

/* =========================================================
   SOCKET CONNECTION
========================================================= */

handleSocketConnection(io);

/* =========================================================
   GLOBAL ERROR HANDLERS
========================================================= */

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

/* =========================================================
   TEST ROUTE
========================================================= */

app.get("/", (req, res) => {
  res.send("🚀 Alvora Backend is Working! 🎉");
});

/* =========================================================
   API ROUTES
========================================================= */

app.use(routes);

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err
        : {},
  });
});

/* =========================================================
   START SERVER
========================================================= */

server.listen(PORT, () => {
  console.log(
    `✅ ChecklistManagement Server is running on port ${PORT} ❤❤❤❤`
  );
});
