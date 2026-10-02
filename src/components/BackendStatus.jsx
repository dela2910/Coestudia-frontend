import { useEffect, useState } from "react";
import { API_URL, getHello } from "../api/client";

// Indicador de conexión con el backend (walking skeleton: GET /api/hello).
export default function BackendStatus() {
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
    <div className={`backend-status backend-${status}`} role="status">
      <span className="backend-dot" />
      {status === "loading" && <span>Conectando con el backend…</span>}
      {status === "success" && (
        <span>
          <strong>Backend conectado</strong> · {message}
        </span>
      )}
      {status === "error" && (
        <span>
          <strong>No se pudo conectar con el backend</strong>
          <span className="backend-url">URL usada: {API_URL}</span>
        </span>
      )}
    </div>
  );
}
