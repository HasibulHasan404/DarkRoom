const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("login", (username) => {
    socket.username = username;
    io.emit("user joined", username);
  });

  socket.on("chat message", (message) => {
    const msg = {
      username: socket.username,
      text: message.text,
      timestamp: new Date(),
      replyTo: message.replyTo || null, // Include replyTo data if available
    };
    io.emit("chat message", msg);
  });

  socket.on("typing", () => {
    socket.broadcast.emit("typing", socket.username);
  });

  socket.on("stop typing", () => {
    socket.broadcast.emit("stop typing");
  });

  socket.on("disconnect", () => {
    io.emit("user left", socket.username);
  });
});

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
