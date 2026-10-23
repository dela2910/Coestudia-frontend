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
    // FastAPI responde {"detail": "mensaje"} o, si falla la validación, una lista de errores
    const detail = typeof data?.detail === "string" ? data.detail : `Error ${res.status}`;
    throw new ApiError(res.status, detail);
  }
  return data;
}

export function getHello() {
  return request("/api/hello");
}
