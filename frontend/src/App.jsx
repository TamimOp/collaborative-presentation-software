import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import socket from "./socket";

const App = () => {
  const [slides, setSlides] = useState([]);
  const [nickname, setNickname] = useState("");
  const [presentationId, setPresentationId] = useState("12345"); // Example ID
  const [newSlideContent, setNewSlideContent] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    socket.emit("join-presentation", { presentationId, nickname });

    socket.on("presentation-data", (data) => {
      setSlides(data.slides);
      setUsers(data.users);
    });

    socket.on("slide-added", (slide) => {
      setSlides((prevSlides) => [...prevSlides, slide]);
    });

    socket.on("slide-removed", (slideIndex) => {
      setSlides((prevSlides) =>
        prevSlides.filter((_, index) => index !== slideIndex)
      );
    });

    socket.on("user-role-changed", ({ socketId, role }) => {
      const updatedUsers = users.map((user) =>
        user.socketId === socketId ? { ...user, role } : user
      );
      setUsers(updatedUsers);
    });

    return () => {
      socket.off("slide-added");
      socket.off("slide-removed");
      socket.off("user-role-changed");
    };
  }, [presentationId, nickname, users]);

  const handleAddSlide = () => {
    const newSlide = { content: newSlideContent };
    socket.emit("add-slide", { presentationId, slide: newSlide });
    setNewSlideContent(""); // Clear the input
  };

  const handleRemoveSlide = (index) => {
    socket.emit("remove-slide", { presentationId, slideIndex: index });
  };

  const handleChangeRole = (socketId, role) => {
    socket.emit("change-role", { presentationId, socketId, role });
  };

  return (
    <Layout>
      <div className="flex items-center justify-center">
        <input
          type="text"
          placeholder="Enter nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>
      <div className="slide-editor">
        <div className="slides">
          {slides.map((slide, index) => (
            <div key={index} className="slide">
              <div>{slide.content}</div>
              <button onClick={() => handleRemoveSlide(index)}>
                Remove Slide
              </button>
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="New Slide Content"
          value={newSlideContent}
          onChange={(e) => setNewSlideContent(e.target.value)}
        />
        <button onClick={handleAddSlide}>Add Slide</button>
      </div>
      <div className="user-list">
        {users.map((user) => (
          <div key={user.socketId}>
            {user.nickname} - {user.role}
            <button onClick={() => handleChangeRole(user.socketId, "Editor")}>
              Promote to Editor
            </button>
            <button onClick={() => handleChangeRole(user.socketId, "Viewer")}>
              Demote to Viewer
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default App;
