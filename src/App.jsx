import { useState } from "react";
import Navbar from "./components/Navbar";
import { currentUser, groups, myGroups } from "./data/mock";
import CreateGroup from "./views/CreateGroup";
import GroupDetail from "./views/GroupDetail";
import Home from "./views/Home";
import Login from "./views/Login";
import Profile from "./views/Profile";
import Results from "./views/Results";
import "./App.css";

const EMPTY_FILTERS = { query: "", modality: null, days: [], blocks: [] };

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  // view: "home" | "results" | "create" | "detail" | "profile"
  const [view, setView] = useState("home");
  const [previousView, setPreviousView] = useState("home");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const navigate = (next) => {
    setPreviousView(view);
    setView(next);
    window.scrollTo?.({ top: 0 });
  };

  const openGroup = (id) => {
    setSelectedGroupId(id);
    navigate("detail");
  };

  if (!loggedIn) {
    return (
      <Login
        onLogin={() => {
          setLoggedIn(true);
          setView("home");
        }}
      />
    );
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="app">
      <Navbar current={view} onNavigate={navigate} userName={currentUser.name} />
      <main className="main">
        {view === "home" && (
          <Home
            user={currentUser}
            initialFilters={filters}
            onSearch={(next) => {
              setFilters(next);
              navigate("results");
            }}
            onCreate={() => navigate("create")}
          />
        )}
        {view === "results" && (
          <Results
            groups={groups}
            filters={filters}
            onBack={() => navigate("home")}
            onOpen={openGroup}
            onCreate={() => navigate("create")}
          />
        )}
        {view === "create" && <CreateGroup user={currentUser} onDone={() => navigate("profile")} />}
        {view === "detail" && selectedGroup && (
          <GroupDetail group={selectedGroup} onBack={() => navigate(previousView)} />
        )}
        {view === "profile" && (
          <Profile
            user={currentUser}
            groups={groups}
            myGroups={myGroups}
            onOpen={openGroup}
            onCreate={() => navigate("create")}
            onLogout={() => setLoggedIn(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
