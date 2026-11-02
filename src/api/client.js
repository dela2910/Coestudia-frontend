export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TOKEN_KEY = "coestudia_token";

// Token de sesión (JWT) que devuelve el login. localStorage puede fallar (modo privado), por eso
// los accesos van envueltos en try/catch.
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Sin almacenamiento la sesión dura solo mientras la pestaña esté abierta
  }
}

// Error de la API con el código HTTP y el mensaje que manda FastAPI en "detail".
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Qué hacer cuando el backend rechaza la sesión (venció o cambió la contraseña). Lo define App.
let sessionExpiredHandler = null;
export const onSessionExpired = (handler) => {
  sessionExpiredHandler = handler;
};

// FastAPI responde {"detail": "mensaje"} o, si falla la validación (422), una lista de errores.
const readDetail = (data, status) => {
  if (typeof data?.detail === "string") return data.detail;
  const first = Array.isArray(data?.detail) ? data.detail[0]?.msg : null;
  // Pydantic antepone "Value error, " a los mensajes de los validadores
  if (first) return first.replace(/^Value error, /, "");
  return `Error ${status}`;
};

// Texto para mostrar al usuario cuando falla una llamada.
export const errorMessage = (error) =>
  error instanceof ApiError ? error.message : "No pudimos conectar con el servidor. Intenta de nuevo.";

// Llamada base a la API: todas las funciones de src/api/ deben usarla.
// Envía y recibe JSON y agrega el token de sesión si existe.
export async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const detail = readDetail(data, res.status);
    // 401 con sesión: el token ya no sirve, se borra y la app vuelve al inicio de sesión
    if (res.status === 401 && token) {
      setToken(null);
      sessionExpiredHandler?.(detail);
    }
    throw new ApiError(res.status, detail);
  }
  return data;
}
