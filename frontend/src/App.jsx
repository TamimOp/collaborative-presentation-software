import { useState, useEffect, useRef } from "react";
import Layout from "./components/Layout";
import socket from "./socket";
import { fabric } from "fabric"; // Fabric.js
import "./index.css";
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
  const [isZoomed, setIsZoomed] = useState(false); // For zoom functionality
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null); // Reference for Fabric.js canvas

  useEffect(() => {
    if (isJoined) {
      socket.on("presentation-data", (data) => {
        setSlides(data.slides);
        setUsers(data.users);
        setPresentationId(data.presentationId); // Ensure presentation ID shows up
        loadDrawings(data.drawings[currentSlideIndex] || []);
      });

      socket.on("draw", (drawingData) => {
        loadDrawingOnCanvas(drawingData);
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

        // Listen for object added to the canvas
        fabricCanvasRef.current.on("object:added", (e) => {
          socket.emit("draw", {
            presentationId,
            drawingData: e.target.toObject(), // Emit the object data to the server
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

  const enableEraseMode = () => {
    fabricCanvasRef.current.isDrawingMode = false;
    fabricCanvasRef.current.on("object:selected", (e) => {
      fabricCanvasRef.current.remove(e.target);

      socket.emit("remove", {
        presentationId,
        drawingData: e.target.toObject(),
        slideIndex: currentSlideIndex,
      });
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

      <div className="flex flex-col justify-center">
        {/* Toolbar with tools */}
        <div className="toolbar flex flex-row space-x-4">
          <button onClick={addTextBlock}>Add Text</button>
          <button onClick={enableEraseMode}>Erase</button>
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
