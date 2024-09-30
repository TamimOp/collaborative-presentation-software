const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const presentations = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create-presentation", ({ nickname }) => {
    const presentationId = socket.id;
    presentations[presentationId] = {
      slides: [{ content: "Slide 1" }],
      users: [{ socketId: socket.id, nickname, role: "Creator" }],
      drawings: {},
    };

    socket.join(presentationId);

    io.to(presentationId).emit("presentation-data", {
      slides: presentations[presentationId].slides,
      users: presentations[presentationId].users,
      drawings: presentations[presentationId].drawings,
      presentationId,
    });
  });

  socket.on("join-presentation", ({ presentationId, nickname }) => {
    const presentation = presentations[presentationId];
    if (!presentation) {
      socket.emit("error", { message: "Presentation not found" });
      return;
    }

    presentation.users.push({ socketId: socket.id, nickname, role: "Viewer" });
    socket.join(presentationId);

    io.to(presentationId).emit("presentation-data", {
      slides: presentation.slides,
      users: presentation.users,
      drawings: presentation.drawings,
      presentationId,
    });
  });

  socket.on("add-slide", ({ presentationId }) => {
    const presentation = presentations[presentationId];
    if (presentation) {
      const newSlide = { content: `Slide ${presentation.slides.length + 1}` };
      presentation.slides.push(newSlide);

      io.to(presentationId).emit("presentation-data", {
        slides: presentation.slides,
        users: presentation.users,
        drawings: presentation.drawings,
        presentationId,
      });
    }
  });

  socket.on("draw", ({ presentationId, drawingData, slideIndex }) => {
    const presentation = presentations[presentationId];
    if (presentation) {
      if (!presentation.drawings[slideIndex]) {
        presentation.drawings[slideIndex] = [];
      }
      presentation.drawings[slideIndex].push(drawingData);
      io.to(presentationId).emit("presentation-data", {
        slides: presentation.slides,
        users: presentation.users,
        drawings: presentation.drawings,
        presentationId,
      });
      // Emit the full drawing data to ensure instant updates
      io.to(presentationId).emit("draw", {
        slideIndex,
        drawings: presentation.drawings[slideIndex],
      });
    }
  });

  socket.on("erase", ({ presentationId, erasedObject, slideIndex }) => {
    const presentation = presentations[presentationId];
    if (presentation) {
      const slideDrawings = presentation.drawings[slideIndex] || [];
      presentation.drawings[slideIndex] = slideDrawings.filter(
        (drawing) => drawing.id !== erasedObject.id
      );
      io.to(presentationId).emit("draw", {
        slideIndex,
        drawings: presentation.drawings[slideIndex],
      });
    }
  });

  socket.on("request-slide-drawing", ({ presentationId, slideIndex }) => {
    const presentation = presentations[presentationId];
    if (presentation) {
      socket.emit(
        "slide-drawing-data",
        presentation.drawings[slideIndex] || []
      );
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
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const presentationId in presentations) {
      const presentation = presentations[presentationId];
      presentation.users = presentation.users.filter(
        (user) => user.socketId !== socket.id
      );
      io.to(presentationId).emit("presentation-data", {
        slides: presentation.slides,
        users: presentation.users,
        drawings: presentation.drawings,
        presentationId,
      });
    }
  });
});

server.listen(4000, () => {
  console.log("Server is running on port 4000");
});
