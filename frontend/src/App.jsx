import { useState, useEffect, useRef } from "react";
import Layout from "./components/Layout";
import socket from "./socket";
import { fabric } from "fabric"; // Fabric.js

const App = () => {
  const [slides, setSlides] = useState([]);
  const [nickname, setNickname] = useState("");
  const [presentationId, setPresentationId] = useState("");
  const [newPresentationId, setNewPresentationId] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const canvasRef = useRef(null); // For Fabric.js canvas
  const fabricCanvasRef = useRef(null); // Reference for fabric.Canvas

  useEffect(() => {
    if (isJoined) {
      socket.on("presentation-data", (data) => {
        setSlides(data.slides);
        setUsers(data.users);
        setPresentationId(data.presentationId);
        loadDrawings(data.drawings[currentSlideIndex] || []); // Load drawings for the current slide
      });

      socket.on("draw", (drawingData) => {
        loadDrawingOnCanvas(drawingData); // Load new drawings in real-time
      });

      socket.on("user-role-changed", ({ socketId, role }) => {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.socketId === socketId ? { ...user, role } : user
          )
        );
      });

      socket.on("slide-drawing-data", (slideDrawings) => {
        loadDrawings(slideDrawings);
      });
    }

    return () => {
      socket.off("presentation-data");
      socket.off("draw");
      socket.off("user-role-changed");
      socket.off("slide-drawing-data");
    };
  }, [isJoined, currentSlideIndex]);

  // Initialize Fabric.js canvas and set up drawing/role-based interaction
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current);
      fabricCanvasRef.current.setWidth(800);
      fabricCanvasRef.current.setHeight(600);
    }

    if (fabricCanvasRef.current) {
      if (role === "Creator" || role === "Editor") {
        fabricCanvasRef.current.isDrawingMode = true;
        fabricCanvasRef.current.selection = true;
        fabricCanvasRef.current.forEachObject((obj) => (obj.selectable = true));
        fabricCanvasRef.current.on("path:created", (e) => {
          socket.emit("draw", {
            presentationId,
            drawingData: e.path,
            slideIndex: currentSlideIndex,
          });
        });
      } else {
        fabricCanvasRef.current.isDrawingMode = false;
        fabricCanvasRef.current.selection = false;
        fabricCanvasRef.current.forEachObject(
          (obj) => (obj.selectable = false)
        );
      }
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [role, presentationId, currentSlideIndex]);

  const loadDrawings = (drawings) => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      drawings.forEach((drawing) => {
        fabric.util.enlivenObjects([drawing], (objects) => {
          objects.forEach((obj) => {
            fabricCanvasRef.current.add(obj);
          });
        });
      });
    }
  };

  const loadDrawingOnCanvas = (drawing) => {
    if (fabricCanvasRef.current) {
      fabric.util.enlivenObjects([drawing], (objects) => {
        objects.forEach((obj) => {
          fabricCanvasRef.current.add(obj);
        });
      });
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
      setRole("Viewer");
      setIsJoined(true);
    }
  };

  const handleChangeRole = (socketId, newRole) => {
    if (role === "Creator") {
      socket.emit("change-role", { presentationId, socketId, role: newRole });
    }
  };

  const handleSlideChange = (newIndex) => {
    setCurrentSlideIndex(newIndex);
    socket.emit("request-slide-drawing", {
      presentationId,
      slideIndex: newIndex,
    });
  };

  const handleAddSlide = () => {
    socket.emit("add-slide", { presentationId });
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
      <div>
        {/* Left Slide Panel */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide border p-2 my-2 ${
              index === currentSlideIndex ? "bg-gray-200" : ""
            }`}
            onClick={() => handleSlideChange(index)}
          >
            {slide.content}
          </div>
        ))}
        {role === "Creator" && (
          <button onClick={handleAddSlide} className="my-2">
            Add Slide
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="border my-4"></canvas>

      <div>
        <h3 className="font-bold">Presentation ID: {presentationId}</h3>
        {users.map((user) => (
          <div key={user.socketId} className="p-2 border my-2">
            {user.nickname} - {user.role}
            {role === "Creator" && (
              <select
                value={user.role}
                onChange={(e) =>
                  handleChangeRole(user.socketId, e.target.value)
                }
              >
                <option value="Viewer">Viewer</option>
                <option value="Editor">Editor</option>
                <option value="Creator">Creator</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default App;
