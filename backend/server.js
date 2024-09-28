const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const presentations = {
  12345: { slides: [], users: [] }, // Example presentation
};

io.on("connection", (socket) => {
  socket.on("join-presentation", ({ presentationId, nickname }) => {
    socket.join(presentationId);

    const user = { nickname, socketId: socket.id, role: "Viewer" };
    presentations[presentationId].users.push(user);

    io.to(presentationId).emit("presentation-data", {
      slides: presentations[presentationId].slides,
      users: presentations[presentationId].users,
    });
  });

  socket.on("add-slide", ({ presentationId, slide }) => {
    presentations[presentationId].slides.push(slide);
    io.to(presentationId).emit("slide-added", slide);
  });

  socket.on("remove-slide", ({ presentationId, slideIndex }) => {
    presentations[presentationId].slides.splice(slideIndex, 1);
    io.to(presentationId).emit("slide-removed", slideIndex);
  });

  socket.on("change-role", ({ presentationId, socketId, role }) => {
    const user = presentations[presentationId].users.find(
      (user) => user.socketId === socketId
    );
    if (user) {
      user.role = role;
      io.to(presentationId).emit("user-role-changed", { socketId, role });
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
