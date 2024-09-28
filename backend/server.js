const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const presentations = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  socket.on("create-presentation", ({ nickname }) => {
    const presentationId = uuidv4();
    presentations[presentationId] = { slides: [], users: [] };

    const user = { nickname, socketId: socket.id, role: "Creator" };
    presentations[presentationId].users.push(user);

    socket.join(presentationId);
    socket.emit("presentation-data", {
      presentationId,
      slides: [],
      users: [user],
    });
    console.log(`Presentation created with ID: ${presentationId}`);
  });

  socket.on("join-presentation", ({ presentationId, nickname }) => {
    const presentation = presentations[presentationId];

    if (presentation) {
      const user = { nickname, socketId: socket.id, role: "Viewer" };
      presentations[presentationId].users.push(user);

      socket.join(presentationId);
      io.to(presentationId).emit("presentation-data", {
        slides: presentation.slides,
        users: presentation.users,
      });

      console.log(`User ${nickname} joined presentation ${presentationId}`);
    } else {
      socket.emit("error", "Presentation not found");
      console.log("Presentation not found for ID:", presentationId);
    }
  });

  socket.on("add-slide", ({ presentationId, slide }) => {
    const presentation = presentations[presentationId];
    if (presentation) {
      presentation.slides.push(slide);
      io.to(presentationId).emit("slide-added", slide);
      console.log("Slide added:", slide);
    }
  });

  socket.on("remove-slide", ({ presentationId, slideIndex }) => {
    const presentation = presentations[presentationId];
    if (presentation) {
      presentation.slides.splice(slideIndex, 1);
      io.to(presentationId).emit("slide-removed", slideIndex);
      console.log(`Slide at index ${slideIndex} removed`);
    }
  });

  socket.on("change-role", ({ presentationId, socketId, role }) => {
    const presentation = presentations[presentationId];
    if (presentation) {
      const user = presentation.users.find(
        (user) => user.socketId === socketId
      );
      if (user) {
        user.role = role;
        io.to(presentationId).emit("user-role-changed", { socketId, role });
        console.log(`User ${socketId} role changed to ${role}`);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
  });
});

server.listen(4000, () => {
  console.log("Server running on port 4000");
});
