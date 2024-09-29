// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const presentations = {};

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("create-presentation", ({ nickname }) => {
    const presentationId = uuidv4();
    presentations[presentationId] = { slides: [], users: [], drawings: [] }; // Added drawings

    const user = { nickname, socketId: socket.id, role: "Creator" };
    presentations[presentationId].users.push(user);
    socket.join(presentationId);

    io.to(presentationId).emit("presentation-data", {
      slides: presentations[presentationId].slides,
      users: presentations[presentationId].users,
      drawings: presentations[presentationId].drawings, // Send drawings
      presentationId,
    });
  });

  socket.on("join-presentation", ({ presentationId, nickname }) => {
    if (presentations[presentationId]) {
      const user = { nickname, socketId: socket.id, role: "Viewer" };
      presentations[presentationId].users.push(user);
      socket.join(presentationId);

      io.to(presentationId).emit("presentation-data", {
        slides: presentations[presentationId].slides,
        users: presentations[presentationId].users,
        drawings: presentations[presentationId].drawings, // Send drawings
        presentationId,
      });
    } else {
      socket.emit("error", { message: "Invalid presentation ID" });
    }
  });

  socket.on("draw", ({ presentationId, drawingData }) => {
    const user = presentations[presentationId].users.find(
      (user) => user.socketId === socket.id
    );
    if (user && (user.role === "Creator" || user.role === "Editor")) {
      presentations[presentationId].drawings.push(drawingData); // Save drawings
      io.to(presentationId).emit("draw", drawingData); // Broadcast to all users
    }
  });

  socket.on("change-role", ({ presentationId, socketId, role }) => {
    if (presentations[presentationId]) {
      const user = presentations[presentationId].users.find(
        (user) => user.socketId === socketId
      );
      if (user) {
        user.role = role;
        io.to(presentationId).emit("user-role-changed", { socketId, role });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    // Optionally remove user from presentation
  });
});

server.listen(4000, () => {
  console.log("Server running on port 4000");
});
