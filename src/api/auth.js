import { request, setToken } from "./client";

// Registro, verificación del correo e inicio de sesión (B02). Endpoints en /api/auth del backend.

// El backend usa los nombres del modelo de datos; las vistas usan estos.
export const toUser = (usuario) => ({
  id: usuario.id,
  name: usuario.nombre,
  email: usuario.email,
  university: usuario.universidad,
  career: usuario.carrera,
  entryYear: usuario.anio_ingreso,
});

// Guarda el token de la sesión y devuelve el usuario.
const startSession = (session) => {
  setToken(session.access_token);
  return toUser(session.usuario);
};

export const register = ({ email, password, name, career, entryYear, acceptedTerms }) =>
  request("/api/auth/registro", {
    method: "POST",
    body: {
      email,
      password,
      nombre: name,
      carrera: career,
      anio_ingreso: Number(entryYear),
      acepta_terminos: acceptedTerms,
    },
  });

export const login = async (email, password) =>
  startSession(await request("/api/auth/login", { method: "POST", body: { email, password } }));

// El token llega en el enlace del correo (?verificar=...); al verificar se inicia la sesión.
export const verifyEmail = async (token) =>
  startSession(await request("/api/auth/verificar", { method: "POST", body: { token } }));

export const resendVerification = (email) =>
  request("/api/auth/reenviar-verificacion", { method: "POST", body: { email } });

// Recuperar contraseña (B04): el backend manda un enlace <frontend>/?restablecer=<token>.
export const requestPasswordReset = (email) =>
  request("/api/auth/recuperar-contrasena", { method: "POST", body: { email } });

export const resetPassword = (token, password) =>
  request("/api/auth/restablecer-contrasena", { method: "POST", body: { token, password } });

// Usuario de la sesión guardada; falla con 401 si el token ya no sirve.
export const getMe = async () => toUser(await request("/api/auth/me"));

export const logout = () => setToken(null);
