import PropTypes from "prop-types";

const Layout = ({
  children,
  nickname,
  setNickname,
  handleCreatePresentation,
  handleJoinPresentation,
  isJoined,
  setNewPresentationId,
  role,
}) => {
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
                onClick={handleCreatePresentation}
              >
                Create Presentation
              </button>
              <input
                type="text"
                placeholder="Presentation ID"
                onChange={(e) => setNewPresentationId(e.target.value)}
                className="bg-gray-700 p-1 ml-2"
              />
              <button
                className="bg-green-500 text-white px-2 py-1 ml-2"
                onClick={handleJoinPresentation}
              >
                Join Presentation
              </button>
            </>
          ) : (
            <span>
              {nickname} ({role})
            </span>
          )}
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-1/6 bg-gray-100 p-2 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Slides</h2>
          {children[0]}
        </aside>

        <main className="flex-1 bg-white p-4 overflow-hidden">
          <h2 className="text-xl font-bold mb-4">Slide Editor</h2>
          {children[1]}
        </main>

        <aside className="w-1/6 bg-gray-100 p-2 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Connected Users</h2>
          {children[2]}{" "}
          {/* This section will now display the connected users */}
        </aside>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  nickname: PropTypes.string.isRequired,
  setNickname: PropTypes.func.isRequired,
  handleCreatePresentation: PropTypes.func.isRequired,
  handleJoinPresentation: PropTypes.func.isRequired,
  isJoined: PropTypes.bool.isRequired,
  setNewPresentationId: PropTypes.func.isRequired,
  role: PropTypes.string.isRequired,
};

export default Layout;
