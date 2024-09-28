import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import socket from "./socket";

const App = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");

      socket.on("user-list", (userList) => {
        setUsers(userList); // Receive updated user list
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Layout>
      <div className="border border-dashed border-gray-300 h-full flex items-center justify-center">
        <p>Slide Editing Area</p>
      </div>
    </Layout>
  );
};

export default App;
