import { useState } from "react";
import Navbar from "./components/Navbar";
import { currentUser, groupFiles, groups, myGroups } from "./data/mock";
import CreateGroup from "./views/CreateGroup";
import GroupDetail from "./views/GroupDetail";
import GroupRoom from "./views/GroupRoom";
import Home from "./views/Home";
import Login from "./views/Login";
import Profile from "./views/Profile";
import Results from "./views/Results";
import VerifyEmail from "./views/VerifyEmail";
import "./App.css";

const EMPTY_FILTERS = { query: "", modality: null, days: [], blocks: [] };

function App() {
  // authStep: "login" | "verify" (verificar correo) | "done"
  const [authStep, setAuthStep] = useState("login");
  const [email, setEmail] = useState("");
  // view: "home" | "results" | "create" | "detail" | "room" | "profile"
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

  // Espacio interno del grupo (asistente y archivos), solo para integrantes.
  const openRoom = (id) => {
    setSelectedGroupId(id);
    navigate("room");
  };

  const isMember = (id) =>
    myGroups.participating.includes(id) || myGroups.created.some((c) => c.groupId === id);

  if (authStep === "login") {
    return (
      <Login
        onLogin={(typedEmail) => {
          setEmail(typedEmail || currentUser.email);
          setAuthStep("verify");
        }}
      />
    );
  }

  if (authStep === "verify") {
    return (
      <VerifyEmail
        email={email}
        onVerified={() => {
          setAuthStep("done");
          setView("home");
        }}
        onChangeEmail={() => setAuthStep("login")}
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
          <GroupDetail
            group={selectedGroup}
            isMember={isMember(selectedGroup.id)}
            onEnter={() => openRoom(selectedGroup.id)}
            onBack={() => navigate(previousView)}
          />
        )}
        {view === "room" && selectedGroup && (
          <GroupRoom
            key={selectedGroup.id}
            group={selectedGroup}
            user={currentUser}
            initialFiles={groupFiles[selectedGroup.id]}
            onBack={() => navigate("profile")}
          />
        )}
        {view === "profile" && (
          <Profile
            user={currentUser}
            groups={groups}
            myGroups={myGroups}
            onOpen={openRoom}
            onCreate={() => navigate("create")}
            onLogout={() => setAuthStep("login")}
          />
        )}
      </main>
    </div>
  );
}

export default App;
