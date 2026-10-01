import { useEffect, useState } from "react";
import { API_URL, getHello } from "./api/client";
import "./App.css";

function App() {
  // status: "loading" | "success" | "error"
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getHello()
      .then((data) => {
        setMessage(data.message);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main className="container">
      <h1>Coestudia</h1>

      {status === "loading" && <p className="muted">Conectando con el backend…</p>}

      {status === "success" && (
        <>
          <p className="message">{message}</p>
          <p className="badge badge-ok">Backend conectado</p>
        </>
      )}

      {status === "error" && (
        <>
          <p className="badge badge-error">No se pudo conectar con el backend</p>
          <p className="muted small">URL usada: {API_URL}</p>
        </>
      )}
    </main>
  );
}

export default App;
