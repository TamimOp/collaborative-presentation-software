const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid"); // For generating presentation IDs

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const presentations = {}; // Store all presentations

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("create-presentation", ({ nickname }) => {
    const presentationId = uuidv4(); // Generate unique presentation ID
    presentations[presentationId] = { slides: [], users: [] };

    const user = { nickname, socketId: socket.id, role: "Creator" };
    presentations[presentationId].users.push(user);
    socket.join(presentationId);

    // Emit presentation data to the creator
    io.to(presentationId).emit("presentation-data", {
      slides: presentations[presentationId].slides,
      users: presentations[presentationId].users,
      presentationId,
    });
  });

  socket.on("join-presentation", ({ presentationId, nickname }) => {
    if (presentations[presentationId]) {
      const user = { nickname, socketId: socket.id, role: "Viewer" };
      presentations[presentationId].users.push(user);
      socket.join(presentationId);

      // Send presentation data to everyone in the presentation, including the new user
      io.to(presentationId).emit("presentation-data", {
        slides: presentations[presentationId].slides,
        users: presentations[presentationId].users,
        presentationId,
      });
    } else {
      socket.emit("error", { message: "Invalid presentation ID" });
    }
  });

  socket.on("add-slide", ({ presentationId, slide }) => {
    if (presentations[presentationId]) {
      presentations[presentationId].slides.push(slide);

      // Emit the updated slide list to everyone, including the creator
      io.to(presentationId).emit("presentation-data", {
        slides: presentations[presentationId].slides,
        users: presentations[presentationId].users,
        presentationId,
      });
    }
  });

  socket.on("remove-slide", ({ presentationId, slideIndex }) => {
    if (presentations[presentationId]) {
      presentations[presentationId].slides.splice(slideIndex, 1);

      // Emit the updated slide list to everyone
      io.to(presentationId).emit("presentation-data", {
        slides: presentations[presentationId].slides,
        users: presentations[presentationId].users,
        presentationId,
      });
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
    // Here you could add logic to remove the user from presentations if needed
  });
});

server.listen(4000, () => {
  console.log("Server running on port 4000");
});
