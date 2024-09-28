socket.on("add-slide", (data) => {
  const { presentationId, slide } = data;
  presentations[presentationId].slides.push(slide);
  io.to(presentationId).emit("slide-added", slide);
});

socket.on("remove-slide", (data) => {
  const { presentationId, slideIndex } = data;
  if (presentations[presentationId]) {
    presentations[presentationId].slides.splice(slideIndex, 1);
    io.to(presentationId).emit("slide-removed", slideIndex);
  }
});

socket.on("change-role", (data) => {
  const { presentationId, socketId, role } = data;
  const user = presentations[presentationId].users.find(
    (user) => user.socketId === socketId
  );
  if (user) {
    user.role = role; // Change user role (Editor or Viewer)
    io.to(presentationId).emit("user-role-changed", { socketId, role });
  }
});

// Add user role during join
socket.on("join-presentation", ({ presentationId, nickname }) => {
  socket.join(presentationId);

  const user = { nickname, socketId: socket.id, role: "Viewer" }; // Default role is Viewer
  presentations[presentationId].users.push(user);

  io.to(presentationId).emit("user-joined", { nickname, socketId: socket.id });
});
