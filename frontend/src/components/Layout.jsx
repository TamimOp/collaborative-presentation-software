import PropTypes from "prop-types"; // Import PropTypes

const Layout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>Collaborative Presentation</div>
        <div>
          Nickname:{" "}
          <input
            type="text"
            className="bg-gray-700 p-1 ml-2"
            placeholder="Enter nickname"
          />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-1/6 bg-gray-100 p-2">
          {/* Left Slide Panel */}
          <div>Slides</div>
        </aside>
        <main className="flex-1 bg-white p-4 overflow-hidden">
          {/* Main Slide Editing Area */}
          {children}
        </main>
        <aside className="w-1/6 bg-gray-100 p-2">
          {/* Right Users Panel */}
          <div>Connected Users</div>
        </aside>
      </div>
    </div>
  );
};

// Add prop types for validation
Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
