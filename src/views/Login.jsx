import { useState } from "react";
import AuthHero from "../components/AuthHero";
import BackendStatus from "../components/BackendStatus";
import Icon from "../components/Icon";
import { universityFromEmail } from "../data/universities";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_ENTRY_YEAR = 1990;

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [career, setCareer] = useState("");
  const [entryYear, setEntryYear] = useState("");
  const [error, setError] = useState("");
  const isLogin = mode === "login";
  const university = universityFromEmail(email);

  // Maqueta: solo se valida el registro; el backend repetirá estas mismas validaciones.
  const registerError = () => {
    if (!name.trim() || !email.trim() || !career.trim() || !entryYear) {
      return "Completa todos los campos.";
    }
    if (!university) return "Por ahora solo se aceptan correos @uc.cl.";
    const year = Number(entryYear);
    if (year < MIN_ENTRY_YEAR || year > CURRENT_YEAR) {
      return `El año de ingreso debe estar entre ${MIN_ENTRY_YEAR} y ${CURRENT_YEAR}.`;
    }
    return "";
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLogin) {
      const message = registerError();
      setError(message);
      if (message) return;
    }
    onLogin(email.trim());
  };

  return (
    <div className="auth">
      <AuthHero />

      <main className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="segmented" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className={isLogin ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className={!isLogin ? "active" : ""}
              onClick={() => switchMode("register")}
            >
              Crear cuenta
            </button>
          </div>

          <div>
            <h2>{isLogin ? "¡Hola de nuevo! 👋" : "Crea tu cuenta"}</h2>
            <p className="muted">
              {isLogin
                ? "Ingresa con tu correo UC para continuar."
                : "Solo necesitas tu correo @uc.cl."}
            </p>
          </div>

          {!isLogin && (
            <label className="field">
              <span className="field-label">Nombre completo</span>
              <div className="input-wrap">
                <Icon name="user" size={18} />
                <input
                  type="text"
                  placeholder="Ej: Camila Pérez"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </label>
          )}

          <label className="field">
            <span className="field-label">Correo UC</span>
            <div className="input-wrap">
              <Icon name="mail" size={18} />
              <input
                type="email"
                placeholder="nombre@uc.cl"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {!isLogin && university && (
              <span className="field-note">
                <Icon name="check" size={14} strokeWidth={2.4} /> {university}
              </span>
            )}
          </label>

          {!isLogin && (
            <div className="field-row">
              <label className="field">
                <span className="field-label">Carrera</span>
                <div className="input-wrap">
                  <Icon name="book" size={18} />
                  <input
                    type="text"
                    placeholder="Ej: Ingeniería Civil"
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                  />
                </div>
              </label>
              <label className="field">
                <span className="field-label">Año de ingreso</span>
                <div className="input-wrap">
                  <Icon name="calendar" size={18} />
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={String(CURRENT_YEAR)}
                    min={MIN_ENTRY_YEAR}
                    max={CURRENT_YEAR}
                    value={entryYear}
                    onChange={(e) => setEntryYear(e.target.value)}
                  />
                </div>
              </label>
            </div>
          )}

          <label className="field">
            <span className="field-label">Contraseña</span>
            <div className="input-wrap">
              <Icon name="lock" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="input-action"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((v) => !v)}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
              </button>
            </div>
          </label>

          {isLogin && (
            <button type="button" className="link-btn align-end">
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block">
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </button>

          <p className="muted center small">
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button
              type="button"
              className="link-btn"
              onClick={() => switchMode(isLogin ? "register" : "login")}
            >
              {isLogin ? "Crear cuenta" : "Inicia sesión"}
            </button>
          </p>

          <BackendStatus />
        </form>
      </main>
    </div>
  );
}
