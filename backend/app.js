const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const express = require("express");

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Instead of a static array, check dynamically:
const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, "") : "";

const allowedOrigins = [
  "http://localhost:5173",
  clientUrl,
];

const checkOrigin = (origin, callback) => {
  // Allow requests with no origin (like mobile apps or curl)
  if (!origin) {
    return callback(null, true);
  }
  
  const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
  if (isAllowed) {
    callback(null, true);
  } else {
    callback(null, false); // Block in browser, do not throw a 500 error in backend
  }
};

app.use(
  cors({
    origin: checkOrigin,
    credentials: true,
  }),
);

const io = new Server(server, {
  cors: {
    origin: checkOrigin,
    credentials: true,
  },
});

const sendActiveUsers = async (documentId) => {
  try {
    const sockets = await io.in(documentId).fetchSockets();
    const activeUsers = sockets
      .map((s) => s.user)
      .filter((u) => u);
    io.to(documentId).emit("active-users", activeUsers);
  } catch (err) {
    console.log("Error sending active users:", err.message);
  }
};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-document", (data) => {
    // Support both old string format and new object format for safety
    const documentId = typeof data === "string" ? data : data.documentId;
    const user = typeof data === "string" ? null : data.user;

    socket.join(documentId);
    socket.documentId = documentId;
    if (user) {
      socket.user = user;
    }
    console.log(`Socket ${socket.id} joined document ${documentId}`);
    
    if (documentId) {
      sendActiveUsers(documentId);
    }
  });

  socket.on("send-changes", ({ documentId, content }) => {
    socket.broadcast.to(documentId).emit("receive-changes", content);
  });

  socket.on("cursor-move", ({ documentId, selection }) => {
    socket.broadcast.to(documentId).emit("cursor-moved", {
      clientId: socket.id,
      user: socket.user,
      selection,
    });
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
    if (socket.documentId) {
      sendActiveUsers(socket.documentId);
      // Broadcast cursor removal
      socket.broadcast.to(socket.documentId).emit("cursor-removed", {
        clientId: socket.id,
      });
    }
  });
});

app.use("/api/auth", authRoutes);

console.log("1");
connectDB();
console.log("2");

app.get("/", (req, res) => {
  console.log("Hey");
  res.send("Hey there! Your server is working.");
});

server.listen(process.env.PORT, () => {
  console.log("Server is running");
});
