import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import socket from "./socket";

const App = () => {
  const [slides, setSlides] = useState([]);
  const [nickname, setNickname] = useState("");
  const [presentationId, setPresentationId] = useState(""); // The current presentation ID
  const [newPresentationId, setNewPresentationId] = useState(""); // For joining
  const [isJoined, setIsJoined] = useState(false);
  const [newSlideContent, setNewSlideContent] = useState("");
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState(""); // Viewer/Editor/Creator

  useEffect(() => {
    if (isJoined) {
      socket.on("presentation-data", (data) => {
        setSlides(data.slides);
        setUsers(data.users);
        setPresentationId(data.presentationId); // Set presentation ID for UI display
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

    return () => {
      socket.off("presentation-data");
      socket.off("slide-added");
      socket.off("slide-removed");
      socket.off("user-role-changed");
    };
  }, [isJoined]);

  const handleAddSlide = () => {
    if (role === "Creator") {
      const newSlide = { content: newSlideContent };
      socket.emit("add-slide", { presentationId, slide: newSlide });
      setNewSlideContent(""); // Clear the input
    }
  };

  const handleRemoveSlide = (index) => {
    if (role === "Creator") {
      socket.emit("remove-slide", { presentationId, slideIndex: index });
    }
  };

  const handleChangeRole = (socketId, newRole) => {
    if (role === "Creator") {
      socket.emit("change-role", { presentationId, socketId, role: newRole });
    }
  };

  const handleCreatePresentation = () => {
    if (nickname) {
      socket.emit("create-presentation", { nickname });
      setRole("Creator");
      setIsJoined(true);
    }
  };

  const handleJoinPresentation = () => {
    if (nickname && newPresentationId) {
      socket.emit("join-presentation", {
        presentationId: newPresentationId,
        nickname,
      });
      setRole("Viewer"); // Default role when joining
      setIsJoined(true);
    }
  };

  return (
    <Layout
      nickname={nickname}
      setNickname={setNickname}
      handleCreatePresentation={handleCreatePresentation}
      handleJoinPresentation={handleJoinPresentation}
      isJoined={isJoined}
      setNewPresentationId={setNewPresentationId}
      role={role}
    >
      {/* Left Slide Panel */}
      <div>
        {slides.map((slide, index) => (
          <div key={index} className="slide border p-2 my-2">
            <div>{slide.content}</div>
            {role === "Creator" && (
              <button onClick={() => handleRemoveSlide(index)}>
                Remove Slide
              </button>
            )}
          </div>
        ))}
        {role === "Creator" && (
          <>
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
          </>
        )}
      </div>
      <div></div>

      {/* Right Connected Users Panel */}
      <div>
        <h3 className="font-bold">Presentation ID: {presentationId}</h3>{" "}
        {/* Display Presentation ID */}
        {users.map((user) => (
          <div key={user.socketId} className="p-2 border my-2">
            {user.nickname} - {user.role}
            {role === "Creator" && (
              <>
                <button
                  onClick={() => handleChangeRole(user.socketId, "Editor")}
                >
                  Promote to Editor
                </button>
                <button
                  onClick={() => handleChangeRole(user.socketId, "Viewer")}
                >
                  Demote to Viewer
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default App;
