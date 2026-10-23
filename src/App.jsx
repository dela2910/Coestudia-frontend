import { useEffect, useRef, useState } from "react";
import { getMe, logout, verifyEmail } from "./api/auth";
import { errorMessage, getToken } from "./api/client";
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

const EMPTY_FILTERS = { query: "", isOnline: null, days: [], blocks: [] };

// Token del enlace de verificación que llega por correo: <frontend>/?verificar=<token>
const verificationToken = () => new URLSearchParams(window.location.search).get("verificar");

// Las asignaturas del perfil todavía salen de los datos de ejemplo (se conectan en B03).
const withMockSubjects = (user) => ({ ...user, subjects: currentUser.subjects });

function App() {
  // authStep: "loading" (revisando la sesión) | "login" | "verify" (verificar correo) | "done"
  const [authStep, setAuthStep] = useState(() =>
    verificationToken() || getToken() ? "loading" : "login",
  );
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  // En desarrollo StrictMode corre los efectos dos veces; el token de verificación es de un solo uso
  const sessionChecked = useRef(false);
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

  const enter = (loggedUser) => {
    setUser(withMockSubjects(loggedUser));
    setAuthStep("done");
    setView("home");
  };

  const showLogin = (notice = "") => {
    setAuthNotice(notice);
    setAuthStep("login");
  };

  // Al abrir la app: primero el enlace de verificación, si no, la sesión guardada.
  useEffect(() => {
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    const token = verificationToken();
    if (token) {
      // Se saca el token de la URL para que no quede en el historial ni se reutilice al recargar
      window.history.replaceState(null, "", window.location.pathname);
      verifyEmail(token)
        .then(enter)
        .catch((err) => showLogin(errorMessage(err)));
    } else if (getToken()) {
      getMe()
        .then(enter)
        .catch(() => {
          logout();
          showLogin();
        });
    }
  }, []);

  const signOut = () => {
    logout();
    setUser(null);
    showLogin();
  };

  const isMember = (id) =>
    myGroups.participating.includes(id) || myGroups.created.some((c) => c.groupId === id);

  if (authStep === "loading") {
    return (
      <div className="auth-loading" role="status">
        Cargando…
      </div>
    );
  }

  if (authStep === "login") {
    return (
      <Login
        key={authNotice}
        notice={authNotice}
        onLoggedIn={enter}
        onNeedsVerification={(typedEmail) => {
          setEmail(typedEmail);
          setAuthStep("verify");
        }}
      />
    );
  }

  if (authStep === "verify") {
    return (
      <VerifyEmail
        email={email}
        onBackToLogin={() => showLogin()}
        onChangeEmail={() => showLogin()}
      />
    );
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="app">
      <Navbar current={view} onNavigate={navigate} userName={user.name} />
      <main className="main">
        {view === "home" && (
          <Home
            user={user}
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
        {view === "create" && <CreateGroup user={user} onDone={() => navigate("profile")} />}
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
            user={user}
            initialFiles={groupFiles[selectedGroup.id]}
            onBack={() => navigate("profile")}
          />
        )}
        {view === "profile" && (
          <Profile
            user={user}
            groups={groups}
            myGroups={myGroups}
            onOpen={openRoom}
            onCreate={() => navigate("create")}
            onLogout={signOut}
          />
        )}
      </main>
    </div>
  );
}

export default App;
