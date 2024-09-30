// App.jsx
import { useState, useEffect, useRef } from "react";
import Layout from "./components/Layout";
import socket from "./socket";
import { fabric } from "fabric"; // Fabric.js
import { jsPDF } from "jspdf";

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
  const [isZoomed, setIsZoomed] = useState(false);
  const [isCursorMode, setIsCursorMode] = useState(false);

  useEffect(() => {
    if (isJoined) {
      socket.on("presentation-data", (data) => {
        setSlides(data.slides);
        setUsers(data.users);
        setPresentationId(data.presentationId);
        loadDrawings(data.drawings); // Load previous drawings
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
    }

    return () => {
      socket.off("presentation-data");
      socket.off("draw");
      socket.off("user-role-changed");
    };
  }, [isJoined]);

  // Initialize Fabric.js canvas and set up drawing/role-based interaction
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      // Initialize fabric.Canvas only once
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current);
      fabricCanvasRef.current.setWidth(800);
      fabricCanvasRef.current.setHeight(600);
    }

    // Enable/disable drawing mode and interaction based on role
    if (fabricCanvasRef.current) {
      if (role === "Creator" || role === "Editor") {
        // Allow drawing for Creator and Editor
        fabricCanvasRef.current.isDrawingMode = true;
        fabricCanvasRef.current.selection = true; // Allow selection for Creator/Editor
        fabricCanvasRef.current.forEachObject((obj) => (obj.selectable = true)); // Allow object selection for Creator/Editor
        fabricCanvasRef.current.on("path:created", (e) => {
          socket.emit("draw", {
            presentationId,
            drawingData: e.path,
            slideIndex: currentSlideIndex,
          });
        });
      } else {
        // For viewers: disable all drawing and interaction
        fabricCanvasRef.current.isDrawingMode = false;
        fabricCanvasRef.current.selection = false; // Disable selection for viewers
        fabricCanvasRef.current.forEachObject(
          (obj) => (obj.selectable = false)
        ); // Disable object movement for viewers
      }
    }

    return () => {
      // Proper cleanup
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.clear(); // Clear canvas
        fabricCanvasRef.current.dispose(); // Dispose fabric instance
        fabricCanvasRef.current = null; // Set to null to avoid multiple dispose calls
      }
    };
  }, [role, presentationId, currentSlideIndex]);

  const loadDrawings = (drawings) => {
    if (fabricCanvasRef.current) {
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
      setRole("Viewer"); // Default to Viewer when joining
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
    // Load the drawing associated with the selected slide
    socket.emit("request-slide-drawing", {
      presentationId,
      slideIndex: newIndex,
    });
  };
  const addTextBlock = () => {
    const text = new fabric.Textbox("Editable text", {
      left: 100,
      top: 100,
      width: 200,
      editable: true,
    });
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);

    socket.emit("draw", {
      presentationId,
      drawingData: text.toObject(),
      slideIndex: currentSlideIndex,
    });
  };
  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
    const zoomFactor = isZoomed ? 1 : 2;
    fabricCanvasRef.current.setZoom(zoomFactor);
    fabricCanvasRef.current.renderAll();
  };
  const addCircle = () => {
    const circle = new fabric.Circle({
      radius: 50,
      fill: "transparent",
      stroke: "black",
      left: 200,
      top: 100,
      selectable: true,
    });
    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);

    socket.emit("draw", {
      presentationId,
      drawingData: circle.toObject(),
      slideIndex: currentSlideIndex,
    });
  };

  const addTriangle = () => {
    const triangle = new fabric.Triangle({
      width: 100,
      height: 100,
      fill: "transparent",
      stroke: "black",
      left: 200,
      top: 200,
      selectable: true,
    });
    fabricCanvasRef.current.add(triangle);
    fabricCanvasRef.current.setActiveObject(triangle);

    socket.emit("draw", {
      presentationId,
      drawingData: triangle.toObject(),
      slideIndex: currentSlideIndex,
    });
  };
  const enablePencilMode = () => {
    fabricCanvasRef.current.isDrawingMode = true;
  };
  const downloadAsPDF = () => {
    const canvasDataURL = fabricCanvasRef.current.toDataURL("image/png");

    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(canvasDataURL);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(canvasDataURL, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`presentation-slide-${currentSlideIndex}.pdf`);
  };
  const toggleCursorMode = () => {
    if (fabricCanvasRef.current) {
      if (isCursorMode) {
        // Switch to drawing mode
        fabricCanvasRef.current.isDrawingMode = true;
      } else {
        // Switch to cursor mode
        fabricCanvasRef.current.isDrawingMode = false;
        fabricCanvasRef.current.selection = true; // Enable object selection
      }
    }
    setIsCursorMode((prevMode) => !prevMode);
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
            <div>{slide.content}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col justify-center">
        {/* Toolbar with tools */}
        <div
          className={`toolbar flex flex-row space-x-4 ${
            role === "Creator" ? "block" : "hidden"
          }`}
        >
          <button onClick={addTextBlock}>Add Text</button>
          <button onClick={toggleCursorMode}>
            {isCursorMode ? "Drawing Mode" : "Cursor Mode"}
          </button>
          <button onClick={toggleZoom}>
            {isZoomed ? "Zoom Out" : "Zoom In"}
          </button>
          <button onClick={addCircle}>Add Circle</button>
          <button onClick={addTriangle}>Add Triangle</button>
          <button onClick={enablePencilMode}>Pencil</button>
          <button onClick={downloadAsPDF} className="border p-1 bg-slate-200">
            Export to PDF
          </button>
        </div>
        <canvas ref={canvasRef} className="border my-4"></canvas>
      </div>

      {/* Right Connected Users Panel */}
      <div>
        <h3 className="font-bold">Presentation ID: {presentationId}</h3>
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
