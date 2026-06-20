const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const express = require("express");

const app = express();
const server = http.createServer(app);

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-document", (documentId) => {
    socket.join(documentId);
    console.log(`Socket ${socket.id} joined document ${documentId}`);
  });

  socket.on("send-changes", ({ documentId, content }) => {
    socket.broadcast.to(documentId).emit("receive-changes", content);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
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
