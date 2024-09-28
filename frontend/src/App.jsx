import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import socket from "./socket";

const App = () => {
  const [slides, setSlides] = useState([]);
  const [nickname, setNickname] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [presentationId] = useState("12345"); // Example ID
  const [newSlideContent, setNewSlideContent] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isJoined) {
      // Emit join-presentation event once when user joins
      socket.emit("join-presentation", { presentationId, nickname });

      // Set up event listeners
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
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.socketId === socketId ? { ...user, role } : user
          )
        );
      });
    }

    // Clean up event listeners on unmount
    return () => {
      socket.off("presentation-data");
      socket.off("slide-added");
      socket.off("slide-removed");
      socket.off("user-role-changed");
    };
  }, [isJoined, presentationId, nickname]);

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

  const handleJoin = () => {
    if (nickname) {
      setIsJoined(true);
    }
  };

  return (
    <Layout
      nickname={nickname}
      setNickname={setNickname}
      handleJoin={handleJoin}
      isJoined={isJoined}
    >
      {/* Left Slide Panel */}
      <div>
        {slides.map((slide, index) => (
          <div key={index} className="slide border p-2 my-2">
            <div>{slide.content}</div>
            <button onClick={() => handleRemoveSlide(index)}>
              Remove Slide
            </button>
          </div>
        ))}
        <input
          type="text"
          placeholder="New Slide Content"
          value={newSlideContent}
          onChange={(e) => setNewSlideContent(e.target.value)}
          className="mt-2 p-2 border"
        />
        <button
          onClick={handleAddSlide}
          className="ml-2 p-2 bg-blue-500 text-white"
        >
          Add Slide
        </button>
      </div>

      {/* Main Slide Editing Area */}
      <div className="p-4">
        {" "}
        {/* You can add your editing functionality here */}{" "}
      </div>

      {/* Right Connected Users Panel */}
      <div>
        {users.map((user) => (
          <div key={user.socketId} className="p-2 border my-2">
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
