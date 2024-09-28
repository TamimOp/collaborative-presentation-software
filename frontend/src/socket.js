import { io } from "socket.io-client";

const socket = io("http://localhost:4000"); // Assuming backend is running on port 4000

export default socket;
