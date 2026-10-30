import { useEffect, useRef, useState } from "react";
import { getMe, logout, verifyEmail } from "./api/auth";
import { errorMessage, getToken, onSessionExpired } from "./api/client";
import { getMySubjects } from "./api/profile";
import Navbar from "./components/Navbar";
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

function App() {
  // authStep: "loading" (revisando la sesión) | "login" | "verify" (verificar correo) | "done"
  const [authStep, setAuthStep] = useState(() =>
    verificationToken() || getToken() ? "loading" : "login",
  );
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  // Datos del registro recién enviado, para volver a él si el correo estaba mal
  const [registerDraft, setRegisterDraft] = useState(null);
  const [loginDraft, setLoginDraft] = useState(null);
  // En desarrollo StrictMode corre los efectos dos veces; el token de verificación es de un solo uso
  const sessionChecked = useRef(false);
  // view: "home" | "results" | "create" | "detail" | "room" | "profile"
  const [view, setView] = useState("home");
  const [previousView, setPreviousView] = useState("home");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // Grupo abierto en el detalle o en su espacio. El detalle se abre desde el buscador; el
  // espacio, desde el detalle o desde "Mis grupos"
  const [selectedGroup, setSelectedGroup] = useState(null);

  const navigate = (next) => {
    setPreviousView(view);
    setView(next);
    window.scrollTo?.({ top: 0 });
  };

  const openGroup = (group) => {
    setSelectedGroup(group);
    navigate("detail");
  };

  // Espacio interno del grupo (asistente y archivos), solo para integrantes.
  const openRoom = (group) => {
    setSelectedGroup(group);
    navigate("room");
  };

  // Cambios del usuario (perfil o asignaturas) sin perder lo demás
  const updateUser = (changes) => setUser((prev) => prev && { ...prev, ...changes });

  const enter = (loggedUser) => {
    // subjects: «mis asignaturas» [{ id, code, name }]; llegan del backend después de entrar
    setUser({ ...loggedUser, subjects: [] });
    setAuthStep("done");
    setView("home");
    getMySubjects()
      .then((subjects) => updateUser({ subjects }))
      .catch(() => {
        // Sin asignaturas la app igual funciona; el perfil permite reintentar agregándolas
      });
  };

  // draft: si viene, se abre "Crear cuenta" con esos datos ya llenos
  const showLogin = (notice = "", draft = null) => {
    setAuthNotice(notice);
    setLoginDraft(draft);
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

  // Si una llamada responde 401 a mitad de uso (la sesión venció), se vuelve al login con el aviso
  useEffect(() => {
    onSessionExpired((detail) => {
      setUser(null);
      showLogin(detail);
    });
    return () => onSessionExpired(null);
  }, []);

  const signOut = () => {
    logout();
    setUser(null);
    showLogin();
  };

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
        draft={loginDraft}
        onLoggedIn={enter}
        onNeedsVerification={(typedEmail, draft = null) => {
          setEmail(typedEmail);
          setRegisterDraft(draft);
          setAuthStep("verify");
        }}
      />
    );
  }

  if (authStep === "verify") {
    return (
      <VerifyEmail
        email={email}
        fromRegister={Boolean(registerDraft)}
        onBackToLogin={() => showLogin()}
        onChangeEmail={() => showLogin("", registerDraft)}
      />
    );
  }

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
            filters={filters}
            onBack={() => navigate("home")}
            onOpen={openGroup}
            onCreate={() => navigate("create")}
          />
        )}
        {view === "create" && <CreateGroup user={user} onOpen={openGroup} />}
        {view === "detail" && selectedGroup && (
          <GroupDetail
            key={selectedGroup.id}
            group={selectedGroup}
            onEnter={openRoom}
            onBack={() => navigate(previousView)}
          />
        )}
        {view === "room" && selectedGroup && (
          <GroupRoom
            key={selectedGroup.id}
            group={selectedGroup}
            user={user}
            // Los archivos todavía no se guardan en el backend (B12): el espacio parte vacío
            onBack={() => navigate("profile")}
          />
        )}
        {view === "profile" && (
          <Profile
            user={user}
            onOpen={openRoom}
            onOpenDetail={openGroup}
            onCreate={() => navigate("create")}
            onUpdateUser={updateUser}
            onLogout={signOut}
          />
        )}
      </main>
    </div>
  );
}

export default App;
