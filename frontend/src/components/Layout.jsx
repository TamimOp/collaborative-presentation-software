import PropTypes from "prop-types";

const Layout = ({ children, nickname, setNickname, handleJoin, isJoined }) => {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>Collaborative Presentation</div>
        <div>
          {!isJoined ? (
            <>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter nickname"
                className="bg-gray-700 p-1 ml-2"
              />
              <button
                className="bg-blue-500 text-white px-2 py-1 ml-2"
                onClick={handleJoin}
              >
                Join Presentation
              </button>
            </>
          ) : (
            <span>{nickname}</span>
          )}
        </div>
      </header>
      <div className="flex flex-1">
        {/* Left Slide Panel */}
        <aside className="w-1/6 bg-gray-100 p-2 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Slides</h2>
          {children[0]}
        </aside>

        {/* Main Slide Editing Area */}
        <main className="flex-1 bg-white p-4 overflow-hidden">
          <h2 className="text-xl font-bold mb-4">Slide Editor</h2>
          {children[1]}
        </main>

        {/* Right Users Panel */}
        <aside className="w-1/6 bg-gray-100 p-2 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Connected Users</h2>
          {children[2]}
        </aside>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  nickname: PropTypes.string.isRequired,
  setNickname: PropTypes.func.isRequired,
  handleJoin: PropTypes.func.isRequired,
  isJoined: PropTypes.bool.isRequired,
};

export default Layout;
